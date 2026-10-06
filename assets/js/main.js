import { quote, fundraiser, nextPriceBreak } from './pricing.js';
import { applySite, loadJson, money } from './site.js';

const [site, pricing] = await Promise.all([applySite(), loadJson('data/pricing.json')]);

// Turnaround promise follows whichever supplier is active.
const turnaround = pricing.suppliers[pricing.activeSupplier]?.turnaroundBusinessDays;
if (turnaround) document.querySelectorAll('[data-turnaround]').forEach((el) => (el.textContent = turnaround));

// ---- Price calculator ----
const calcForm = document.getElementById('calc-form');
const garmentSelect = document.getElementById('garment');
const quoteGarment = document.getElementById('quote-garment');

for (const g of pricing.garments) {
  garmentSelect.add(new Option(g.name, g.id));
  quoteGarment.add(new Option(g.name, g.name));
}
quoteGarment.add(new Option('Not sure yet', 'Not sure yet'));

for (const [id, startAt] of [['front-colors', 1], ['back-colors', 0]]) {
  const select = document.getElementById(id);
  select.add(new Option('None', 0));
  for (let c = 1; c <= pricing.maxColorsPerLocation; c++) {
    select.add(new Option(`${c} color${c > 1 ? 's' : ''}`, c));
  }
  select.value = startAt;
}

let currentUnitPrice = 0;

function readCalc() {
  const data = Object.fromEntries(new FormData(calcForm));
  return { ...data, qty: Number(data.qty), frontColors: Number(data.frontColors), backColors: Number(data.backColors) };
}

function updateCalc() {
  const input = readCalc();
  const unitEl = document.getElementById('unit-price');
  const detail = document.getElementById('price-detail');
  const nudge = document.getElementById('price-nudge');
  try {
    const q = quote(pricing, input);
    currentUnitPrice = q.unitPrice;
    unitEl.textContent = money(q.unitPrice);
    detail.textContent = `${q.qty} × ${q.garment} = ${money(q.total)} total · ${
      q.method === 'screen' ? 'screen printed' : 'full-color digital print'
    }`;

    const next = nextPriceBreak(pricing, q.qty);
    nudge.textContent = '';
    if (next) {
      const better = quote(pricing, { ...input, qty: next });
      if (better.unitPrice < q.unitPrice) {
        nudge.textContent = `Add ${next - q.qty} more and pay ${money(better.unitPrice)} each.`;
      }
    }
  } catch (err) {
    currentUnitPrice = 0;
    unitEl.textContent = '—';
    detail.textContent = err.message;
    nudge.textContent = '';
  }
  updateFundraiser();
}

calcForm.addEventListener('input', updateCalc);

// Carry the calculator choices into the quote form.
document.getElementById('calc-cta').addEventListener('click', () => {
  const { garmentId, qty } = readCalc();
  const garment = pricing.garments.find((g) => g.id === garmentId);
  if (garment) quoteGarment.value = garment.name;
  const qtyInput = document.querySelector('#quote-form [name=quantity]');
  if (qty > 0) qtyInput.value = qty;
});

// ---- Fundraiser calculator ----
const fundPrice = document.getElementById('fund-price');
const fundQty = document.getElementById('fund-qty');

function updateFundraiser() {
  document.getElementById('fund-cost').value = currentUnitPrice ? money(currentUnitPrice) : '—';
  const memberPrice = Number(fundPrice.value) || 0;
  const qty = Math.max(0, Math.floor(Number(fundQty.value) || 0));
  const totalEl = document.getElementById('fund-total');
  const detail = document.getElementById('fund-detail');
  if (!currentUnitPrice) {
    totalEl.textContent = '—';
    detail.textContent = 'Pick a garment and print in the pricing calculator first.';
    return;
  }
  const f = fundraiser(currentUnitPrice, memberPrice, qty);
  if (f.perItem < 0) {
    totalEl.textContent = '$0';
    detail.textContent = `Members would pay less than our price. Set at least ${money(currentUnitPrice)}.`;
    return;
  }
  totalEl.textContent = money(f.total);
  detail.textContent = `${money(f.perItem)} per piece × ${qty} pieces goes to your org.`;
}

fundPrice.addEventListener('input', updateFundraiser);
fundQty.addEventListener('input', updateFundraiser);

updateCalc();

// Hero example uses real numbers from the pricing file, never a made-up claim.
try {
  const example = quote(pricing, { garmentId: pricing.garments[0].id, qty: 48, frontColors: 1, backColors: 0 });
  const raised = fundraiser(example.unitPrice, 25, 48).total;
  document.getElementById('hero-sticker').innerHTML =
    `Sell 48 tees at $25<br><small>your club keeps ${money(raised)}</small>`;
} catch {
  /* keep the static fallback text */
}

// ---- Quote request ----
const quoteForm = document.getElementById('quote-form');
const status = document.getElementById('quote-status');

quoteForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(quoteForm));
  data.fundraiser = data.fundraiser ? 'yes' : 'no';

  if (site.formEndpoint) {
    status.textContent = 'Sending...';
    try {
      const res = await fetch(site.formEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      quoteForm.reset();
      status.textContent = `Got it! Your mockup is on the way within ${site.mockupHours} hours.`;
    } catch {
      status.textContent = site.contactEmail
        ? `Something went wrong. Email us at ${site.contactEmail} instead.`
        : 'Something went wrong. Please try again in a minute.';
    }
    return;
  }

  if (site.contactEmail) {
    const body = Object.entries(data).map(([k, v]) => `${k}: ${v}`).join('\n');
    const subject = `Merch request: ${data.organization || 'new org'}`;
    window.location.href = `mailto:${site.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    status.textContent = 'Opening your email app...';
    return;
  }

  status.textContent = 'Requests open soon. Check back shortly!';
});
