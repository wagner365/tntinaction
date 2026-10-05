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

// input: { garmentId, qty, frontColors, backColors }
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

  const useScreen = qty >= config.screenPrint.minQty;
  let decorationPerUnit;
  let setupFee = 0;

  if (useScreen) {
    const tier = tierFor(config.screenPrint.tiers, qty);
    decorationPerUnit = printedSides.reduce(
      (sum, colors) => sum + tier.firstColor + (colors - 1) * tier.extraColor,
      0
    );
    const screens = printedSides.reduce((sum, colors) => sum + colors, 0);
    setupFee = screens * config.screenPrint.setupPerScreen;
  } else {
    decorationPerUnit = printedSides.length * config.digitalPrint.perLocation;
  }

  // Setup is folded into the unit price so customers see one all-in number.
  const unitCost = garment.blankCost + decorationPerUnit + setupFee / qty;
  const unitPrice = roundUp(unitCost / (1 - config.targetMargin), config.roundTo);
  const total = cents(unitPrice * qty);

  return {
    garment: garment.name,
    method: useScreen ? 'screen' : 'digital',
    qty,
    unitCost: cents(unitCost),
    unitPrice,
    total,
    profit: cents(total - unitCost * qty),
  };
}

// What a student org raises if members pay memberPrice and we charge unitPrice.
export function fundraiser(unitPrice, memberPrice, qty) {
  const perItem = cents(memberPrice - unitPrice);
  return { perItem, total: cents(perItem * qty) };
}

// Quantity where the next price break starts, so the UI can nudge
// "order 6 more and save $X each". Returns null when already at the top tier.
export function nextPriceBreak(config, qty) {
  const breaks = [config.screenPrint.minQty, ...config.screenPrint.tiers.map((t) => t.minQty)];
  const next = [...new Set(breaks)].sort((a, b) => a - b).find((b) => b > qty);
  return next ?? null;
}
