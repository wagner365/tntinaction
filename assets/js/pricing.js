// Pricing engine. Pure functions only, so the same code runs on the site
// and in the Node tests. All numbers come from data/pricing.json.

const cents = (n) => Math.round(n * 100) / 100;

export function roundUp(value, step) {
  if (!step) return cents(value);
  // Small epsilon keeps 12.0000001 from rounding up to the next step.
  return cents(Math.ceil(value / step - 1e-9) * step);
}

function tierFor(tiers, qty) {
  let match = null;
  for (const tier of tiers) {
    if (qty >= tier.minQty) match = tier;
  }
  return match;
}

function getSupplier(config, id) {
  const supplier = config.suppliers[id];
  if (!supplier) throw new Error(`Unknown supplier: ${id}`);
  return supplier;
}

// Cost to us for one piece, before margin.
function unitCostFor(config, supplierId, garmentId, qty, printedSides) {
  const supplier = getSupplier(config, supplierId);

  if (supplier.method === 'screen') {
    if (qty < supplier.minQty) {
      if (!supplier.fallbackSupplier) {
        throw new Error(`Screen printing needs at least ${supplier.minQty} pieces`);
      }
      return unitCostFor(config, supplier.fallbackSupplier, garmentId, qty, printedSides);
    }
    const blank = supplier.blankCost[garmentId];
    if (blank === undefined) throw new Error(`${supplier.name} doesn't offer this garment`);
    const tier = tierFor(supplier.tiers, qty);
    const decoration = printedSides.reduce((sum, colors) => sum + tier.firstColor + (colors - 1) * tier.extraColor, 0);
    const screens = printedSides.reduce((sum, colors) => sum + colors, 0);
    const screen = {
      cost: blank + decoration + (screens * supplier.setupPerScreen) / qty + (supplier.shippingPerPiece ?? 0),
      method: 'screen',
      supplierId,
    };
    // Small screen runs with many colors can cost more than digital; use whichever is cheaper.
    if (supplier.fallbackSupplier) {
      const backup = unitCostFor(config, supplier.fallbackSupplier, garmentId, qty, printedSides);
      if (backup.cost < screen.cost) return backup;
    }
    return screen;
  }

  // Digital (DTG/DTF): color count doesn't matter, only how many places are printed.
  const base = supplier.garmentCost[garmentId];
  if (base === undefined) throw new Error(`${supplier.name} doesn't offer this garment`);
  const discount = tierFor(supplier.qtyDiscounts, qty)?.pct ?? 0;
  return {
    cost: base * (1 - discount) + (printedSides.length - 1) * supplier.extraLocation + (supplier.shippingPerPiece ?? 0),
    method: 'digital',
    supplierId,
  };
}

// input: { garmentId, qty, frontColors, backColors, supplier? }
// frontColors/backColors = number of ink colors on that side (0 = not printed).
export function quote(config, input) {
  const garment = config.garments.find((g) => g.id === input.garmentId);
  if (!garment) throw new Error(`Unknown garment: ${input.garmentId}`);

  const qty = Math.floor(Number(input.qty));
  if (!Number.isFinite(qty) || qty < 1) throw new Error('Quantity must be at least 1');

  const sides = [input.frontColors, input.backColors].map((c) => Math.floor(Number(c) || 0));
  if (sides.some((c) => c < 0 || c > config.maxColorsPerLocation)) {
    throw new Error(`Colors per side must be between 0 and ${config.maxColorsPerLocation}`);
  }
  const printedSides = sides.filter((c) => c > 0);
  if (printedSides.length === 0) throw new Error('Pick at least one print location');

  const supplierId = input.supplier ?? config.activeSupplier;
  const { cost, method, supplierId: usedId } = unitCostFor(config, supplierId, garment.id, qty, printedSides);
  const used = getSupplier(config, usedId);
  const unitPrice = roundUp(cost / (1 - config.targetMargin), config.roundTo);
  const total = cents(unitPrice * qty);

  return {
    garment: garment.name,
    supplier: used.name,
    method,
    qty,
    turnaroundBusinessDays: used.turnaroundBusinessDays,
    unitCost: cents(cost),
    unitPrice,
    total,
    profit: cents(total - cost * qty),
  };
}

// Same order priced with every supplier, for deciding who to use.
export function compareSuppliers(config, input) {
  return Object.keys(config.suppliers).map((id) => {
    try {
      return { id, ...quote(config, { ...input, supplier: id }) };
    } catch (err) {
      return { id, error: err.message };
    }
  });
}

// What a student org raises if members pay memberPrice and we charge unitPrice.
export function fundraiser(unitPrice, memberPrice, qty) {
  const perItem = cents(memberPrice - unitPrice);
  return { perItem, total: cents(perItem * qty) };
}

// Quantity where the next price break starts, so the UI can nudge
// "order 6 more and save $X each". Returns null when already at the top tier.
export function nextPriceBreak(config, qty, supplierId = config.activeSupplier) {
  const breaks = [];
  const collect = (id) => {
    const s = getSupplier(config, id);
    for (const t of s.qtyDiscounts ?? s.tiers ?? []) breaks.push(t.minQty);
    if (s.minQty) breaks.push(s.minQty);
    if (s.fallbackSupplier) collect(s.fallbackSupplier);
  };
  collect(supplierId);
  return breaks.sort((a, b) => a - b).find((b) => b > qty) ?? null;
}
