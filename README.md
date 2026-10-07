# The Northern Threads: custom merch for campus orgs

Custom merch for student orgs: a website with instant pricing, a fundraiser calculator, a free-mockup request form, and **pre-order pages for each org**. It's a plain HTML/CSS/JS site with no build step, hosted free on GitHub Pages.

| Page or tool | What it does |
|---|---|
| `index.html` | Homepage: pitch, instant price calculator, fundraiser calculator, FAQ, quote form |
| `store.html?s=<org>` | Pre-order page for one org, built from `stores/<org>.json` |
| `npm run sizes` | Turns your Square (or Stripe) export into a size breakdown for the printer |
| `npm run compare` | Prices the same order with every supplier side by side |
| `docs/competitor-south-by-sea.md` | Competitor brief and positioning |
| `docs/suppliers.md` | Printful vs DTF vs local screen printers, with a recommendation |
| `docs/local-printers.md` | Oxford-area screen printers and how to get reseller pricing |
| `docs/beta-program.md` | Founding Clubs plan (free orders for Applied AI Club and Side Hustle Club) |

## Files you'll edit
- **`data/site.json`**: brand name, campus, contact email, Instagram, form endpoint.
- **`data/pricing.json`**: supplier costs and target margin.
  - `activeSupplier` picks whose costs (and turnaround days) the website uses: `printful`, `dtf` or `local-screen`.
- **`stores/*.json`**: one file per group order.

## Go live on GitHub Pages
1. Merge this branch into `main`.
2. Repo **Settings → Pages → Source: Deploy from a branch → `main` / root → Save**.
3. The site goes live at `https://wagner365.github.io/tntinaction/`. A custom domain can be added later on the same page.

## Turn on the quote form
Until `contactEmail` or `formEndpoint` is set in `data/site.json`, the form only says requests open soon. For a real inbox form:
1. Create a free form at [formspree.io](https://formspree.io) and copy its endpoint (`https://formspree.io/f/xxxx`).
2. Paste it into `formEndpoint`.

## Run a group order with Square
1. **Create one Square item per product.** Go to **Square Dashboard → Items → Create item**. Name it like `Team Hoodie - Club Lacrosse` and set the price.
2. **Add the sizes as variations.** Add S, M, L, XL, 2XL. Buyers then see a "Select One" size choice on the payment link.
3. **Make a payment link per item.** Go to **Online → Payment links → Create link → Sell items**, choose the item, and turn on collecting the buyer's **name**, so you can sort the delivery by name.
4. **Create the store file.** Copy `stores/demo.json` to `stores/<org-name>.json` (lowercase, dashes). Fill in:
   - `org`, `title`, `closes` (with timezone, e.g. `2027-03-07T23:59:00-05:00`)
   - `minimum`, `fundraiser`, and each product's `payLink` (the `https://square.link/...` URL)
5. **Share the link.** Send `https://wagner365.github.io/tntinaction/store.html?s=<org-name>` to the org leader.
6. **Track progress.** Update `ordered` every few days so the progress bar moves.
7. **Close and print.** After `closes` passes, the page locks automatically, but **also deactivate the Square links**. Then:
   - Go to **Dashboard → Transactions → Export → Item Detail CSV**, filtered to the order dates.
   - Run:
     ```
     node scripts/size-report.mjs items.csv --out printer-sheet.csv
     ```
   - It reads the size from Square's "Price Point Name" column and subtracts refunds. If you used another column, add `--size-col "Name"`.
8. **Below the minimum?** Refund everyone from Square.

Exported CSVs contain customer names, so `*.csv` is git-ignored. Never commit them.

## Free (sponsored) orders
Set `"free": true` and a `claimLink` (a Google Form with Name, Email, Size) in the store file. The page then shows "Free" and a "Claim yours" button instead of payment links. See `stores/applied-ai-club.json` and `docs/beta-program.md`.

## Check your work
```
npm test        # pricing math, store files, size report
npm run compare # supplier costs side by side
npm run serve   # preview at http://localhost:8000
```
Tests also run automatically on every push (`.github/workflows/test.yml`).
