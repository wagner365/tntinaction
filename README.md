# TNT Custom Co.

Custom merch for student orgs: a website with instant pricing, a fundraiser calculator, a free-mockup request form, and **pre-order pages for each org**. It's a plain HTML/CSS/JS site with no build step, hosted free on GitHub Pages.

| Page | What it does |
|---|---|
| `index.html` | Homepage: pitch, instant price calculator, fundraiser calculator, FAQ, quote form |
| `store.html?s=<org>` | Pre-order page for one org, built from `stores/<org>.json` |
| `scripts/size-report.mjs` | Turns the payments export into a size breakdown for the printer |
| `docs/competitor-south-by-sea.md` | Competitor brief and positioning |

## Files you'll edit
- **`data/site.json`**: brand name, campus, contact email, Instagram, form endpoint, turnaround days.
- **`data/pricing.json`**: your real blank costs, print costs, setup fees and target margin. Every price on the site is calculated from this file.
- **`stores/*.json`**: one file per group order.

## Go live on GitHub Pages
1. Merge this branch into `main`.
2. Repo **Settings → Pages → Source: Deploy from a branch → `main` / root → Save**.
3. The site goes live at `https://wagner365.github.io/tntinaction/`. A custom domain can be added later on the same page.

## Turn on the quote form
Without setup the form opens the visitor's email app, which needs `contactEmail` in `site.json`. For a real inbox form:
1. Create a free form at [formspree.io](https://formspree.io) and copy its endpoint (`https://formspree.io/f/xxxx`).
2. Paste it into `formEndpoint` in `data/site.json`.

## Run a group order
1. **Create the payment links.** In Stripe, make one **Payment Link** per product:
   - Set the price.
   - Under **Advanced options → Add custom field → Dropdown**, label it `Size` with your sizes.
   - Turn on "collect customer name" so you can sort the delivery by name.
2. **Create the store file.** Copy `stores/demo.json` to `stores/<org-name>.json` (lowercase, dashes). Fill in:
   - `org`, `title`, `closes` (with timezone, e.g. `2027-03-07T23:59:00-05:00`)
   - `minimum`, `fundraiser`, and each product's `payLink`
3. **Share the link.** Send `https://wagner365.github.io/tntinaction/store.html?s=<org-name>` to the org leader.
4. **Track progress.** Update `ordered` every few days so the progress bar moves.
5. **Close and print.** After `closes` passes, the page locks automatically, but **also deactivate the Stripe links**. Then:
   - Export payments as CSV from Stripe.
   - Run:
     ```
     node scripts/size-report.mjs export.csv --out printer-sheet.csv
     ```
   - If it can't find the size column, add `--size-col "Size"` (or whatever Stripe named it).
6. **Below the minimum?** Refund everyone from Stripe.

## Check your work
```
npm test        # pricing math, store files, size report
npm run serve   # preview at http://localhost:8000
```
Tests also run automatically on every push (`.github/workflows/test.yml`). They catch typos in store files before an org sees a broken page.
