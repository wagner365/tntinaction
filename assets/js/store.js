// Renders a group pre-order page from stores/<slug>.json.
// URL: store.html?s=<slug>   (e.g. store.html?s=demo)

import { applySite, loadJson, money } from './site.js';
import { storeStatus } from './store-status.js';

const $ = (id) => document.getElementById(id);
const el = (tag, props = {}, children = []) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
};

const SHAPES = {
  tee: 'M110 30 L70 45 L20 90 L50 130 L80 110 L80 270 L240 270 L240 110 L270 130 L300 90 L250 45 L210 30 Q160 70 110 30 Z',
  hoodie: 'M120 40 Q160 0 200 40 L250 55 L300 140 L268 160 L240 120 L240 275 L80 275 L80 120 L52 160 L20 140 L70 55 Z',
  crewneck: 'M115 35 L70 50 L25 150 L55 165 L82 115 L80 272 L240 272 L238 115 L265 165 L295 150 L250 50 L205 35 Q160 62 115 35 Z',
};

// Simple on-brand mockup so a store looks finished before real photos exist.
function mockup(product) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 320 300');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `${product.name} mockup`);
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', SHAPES[product.type] ?? SHAPES.tee);
  path.setAttribute('fill', product.color || '#13213c');
  path.setAttribute('stroke', 'rgba(0,0,0,.12)');
  svg.append(path);
  const text = document.createElementNS(ns, 'text');
  text.setAttribute('x', '160');
  text.setAttribute('y', '175');
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('fill', product.inkColor || '#ffffff');
  text.setAttribute('font-family', 'Archivo Black, sans-serif');
  const label = (product.printText || '').slice(0, 18);
  text.setAttribute('font-size', label.length > 10 ? '20' : '28');
  text.textContent = label;
  svg.append(text);
  return svg;
}

function productCard(product, isOpen) {
  const img = product.image
    ? el('img', { src: product.image, alt: product.name, loading: 'lazy' })
    : mockup(product);

  const sizes = el('div', { className: 'sizes' }, (product.sizes ?? []).map((s) => el('span', { textContent: s })));
  const canBuy = isOpen && product.payLink;
  const button = el('a', {
    className: 'btn',
    href: canBuy ? product.payLink : '#',
    textContent: !isOpen ? 'Order closed' : product.payLink ? 'Order now' : 'Opening soon',
    rel: 'noopener',
  });
  if (!canBuy) button.setAttribute('aria-disabled', 'true');

  return el('article', { className: 'product' }, [
    el('div', { className: 'product-img' }, [img]),
    el('div', { className: 'product-body' }, [
      el('h3', { textContent: product.name }),
      el('p', { className: 'price', textContent: money(product.price) }),
      product.description ? el('p', { textContent: product.description }) : '',
      sizes,
      el('p', { textContent: 'Pick your size at checkout.' }),
      button,
    ]),
  ]);
}

async function main() {
  await applySite();
  const slug = new URLSearchParams(location.search).get('s') || 'demo';
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error('That order link looks wrong.');

  let store;
  try {
    store = await loadJson(`stores/${slug}.json`);
  } catch {
    throw new Error("We couldn't find that order page. Double-check the link from your org.");
  }

  const status = storeStatus(store);
  document.title = `${store.title} | ${store.org}`;
  $('store-org').textContent = store.org;
  $('store-title').textContent = store.title;
  $('store-blurb').textContent = store.blurb ?? '';

  const pills = [
    el('span', {
      className: `pill ${status.isOpen ? 'live' : 'closed'}`,
      textContent: status.isOpen ? `Open · ${status.timeLeft} left` : 'Order closed',
    }),
    el('span', { className: 'pill', textContent: `Closes ${status.closesLabel}` }),
  ];
  if (store.delivery) pills.push(el('span', { className: 'pill', textContent: store.delivery }));
  $('store-meta').replaceChildren(...pills);

  if (store.minimum) {
    const pct = Math.min(100, Math.round(((store.ordered ?? 0) / store.minimum) * 100));
    const bar = el('div', { className: 'progress' }, [el('span')]);
    bar.firstChild.style.width = `${pct}%`;
    $('store-progress').replaceChildren(
      el('p', { className: 'muted', textContent: `${store.ordered ?? 0} of ${store.minimum} pieces ordered toward the minimum` }),
      bar
    );
  }

  const notices = [];
  if (store.fundraiser?.perItem) {
    notices.push(
      el('p', {
        className: 'notice',
        textContent: `Every piece you buy sends ${money(store.fundraiser.perItem)} to ${store.fundraiser.beneficiary || store.org}.`,
      })
    );
  }
  $('store-notices').replaceChildren(...notices);

  $('products').replaceChildren(...store.products.map((p) => productCard(p, status.isOpen)));
}

main().catch((err) => {
  $('store-title').textContent = 'Order page not found';
  $('store-blurb').textContent = err.message;
});
