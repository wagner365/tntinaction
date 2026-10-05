// Shared helpers for every page: loads data/site.json and fills in the
// brand name, campus and timing numbers wherever the HTML asks for them.

export const money = (n) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: n % 1 ? 2 : 0 });

export async function loadJson(path) {
  const res = await fetch(path, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Could not load ${path} (${res.status})`);
  return res.json();
}

export async function applySite(base = '') {
  const site = await loadJson(`${base}data/site.json`);
  const fill = (selector, value) => {
    if (value === undefined || value === null || value === '') return;
    document.querySelectorAll(selector).forEach((el) => (el.textContent = value));
  };
  fill('[data-brand]', site.brandName);
  fill('[data-campus]', site.campus);
  fill('[data-turnaround]', site.turnaroundBusinessDays);
  fill('[data-mockup]', site.mockupHours);
  document.title = document.title.replace('TNT Custom Co.', site.brandName);

  const contact = document.getElementById('footer-contact');
  if (contact) {
    const link = (href, text) => Object.assign(document.createElement('a'), { href, textContent: text, rel: 'noopener' });
    const parts = [];
    if (site.contactEmail) parts.push(link(`mailto:${site.contactEmail}`, site.contactEmail));
    if (site.instagram) {
      const handle = site.instagram.replace(/^@/, '');
      parts.push(link(`https://instagram.com/${encodeURIComponent(handle)}`, `@${handle}`));
    }
    contact.replaceChildren(...parts.flatMap((p, i) => (i ? [' · ', p] : [p])));
  }
  return site;
}
