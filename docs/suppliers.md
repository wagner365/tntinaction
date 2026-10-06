# Suppliers: is there something cheaper than Printful?

_Research date: October 2026. Costs marked **(est.)** are estimates built from published prices. Replace them with real quotes in `data/pricing.json`, then run `npm run compare`._

## Short answer
**Yes. Pressing DTF transfers yourself is about 30–40% cheaper than Printful** on every order size we tested. It's also faster (about 5 business days instead of 8). A local screen printer only beats DTF once orders reach roughly 48+ pieces of a simple design.

**Recommended path:**
1. **Beta orders (now):** keep using **Printful bulk orders**. There's no equipment to buy, and you already know it.
2. **After 2–3 paid orders:** buy a heat press (~$200–400). Order blanks wholesale and DTF transfers online, and switch `activeSupplier` to `"dtf"`.
3. **At 48+ pieces of a 1–2 color design:** get a quote from an Oxford screen printer and compare with `npm run compare`.

## What the site's pricing engine shows (current numbers, 40% margin)
| Order | Printful: your cost → price | DTF yourself: your cost → price |
|---|---|---|
| 12 tees, 1-color front | $10.00 → $17.00 | $6.50 → $11.00 |
| 48 tees, 1-color front | $8.52 → $14.50 | $6.20 → $10.50 |
| 48 tees, front + back | $14.02 → $23.50 | $8.70 → $14.50 |
| 24 hoodies, front | $23.50 → $39.50 | $14.27 → $24.00 |
| 36 crewnecks, front | $16.29 → $27.50 | $11.43 → $19.50 |

With DTF you can **undercut South by Sea on price and still earn more per piece**. Or keep the price the same and give the club a bigger fundraiser cut.

## The options

### 1. Printful bulk orders (current)
- Gildan 64000 tee starts around **$7.50–9.25** with one print included. A Gildan 18500 hoodie is about **$22.75**.
- Bulk discounts reach "up to 43% off". One published example: a hoodie dropped from $22.75 to $14.11 in bulk. **The discount tiers in `pricing.json` are estimates. Check your dashboard.**
- ✅ No equipment, no labor, consistent quality, and you already use it.
- ❌ Highest cost per piece, slowest (fulfillment plus shipping to you), extra charge for back prints.

### 2. Printify
- Gildan 5000 tee is **$8.80** on the free plan, **$6.20–7.04** with Premium (about $25–39/month).
- It's only cheaper than Printful if you pay for Premium. Quality varies by which print provider you pick.
- Printful and Printify now share a parent company (FYUL) but still run separately.
- Verdict: **not worth switching** for group orders. DTF beats it.

### 3. DTF transfers + heat press (recommended next step)
- **Transfers:** Ninja Transfers gang sheets are about $0.02 per square inch with no minimum and 24–48 hour turnaround. A 10"×10" front print is roughly **$2–3.50 each (est.)**, and cheaper on larger sheets. Other vendors (Lion DTF, Best Price DTF) are worth comparing.
- **Blanks:** buy wholesale from **S&S Activewear** or **SanMar** with a free reseller account. Logged-out prices show Gildan 5000 from $6.22 and Comfort Colors 1717 from $13.04, but **account pricing is lower**. Get your account and update `garmentCost` in `pricing.json`.
- **Equipment:** an entry heat press costs about **$200–400**. One 12-piece order pays for it.
- **Labor:** about 1–2 minutes per shirt, so 48 shirts is a couple of hours.
- ✅ Cheapest, fastest, full-color at no extra cost, works for 1 piece or 100.
- ❌ Your time, and quality depends on pressing correctly. Practice on Northern Threads blanks first.
- Don't buy a DTF *printer*. Those setups run **$5,000–20,000**. Buy the transfers instead.

### 4. Local Oxford screen printers
- **Lebowski Tees** (316 S College Ave, 513-523-8337), **Same Day Custom** (no minimums, no setup fees), and **Custom One**.
- Ask for a **contract/reseller rate**, since you bring the customers and they print. Typical market rates for 50 shirts with a 1-color print are **$7–11 each** retail. Contract rates should be lower.
- ✅ Same-day or next-day possible, no shipping, great for big simple orders.
- ❌ They could see your customers as theirs. Keep the client relationship yourself.

### 5. Contract printers that ship to you (Real Thread, Threadbird)
- Real Thread publishes about **$7–10 per cotton garment**, with no per-size minimum.
- Good for big runs later. Not needed yet.

## What to put in `data/pricing.json`
- `printful.garmentCost` and `qtyDiscounts` come from your Printful dashboard.
- `dtf.garmentCost` is your wholesale blank price plus the transfer price.
- `local-screen` comes from a real quote. Ask Lebowski Tees for 48 tees with a 1-color front.
- Then run `npm run compare` and switch `activeSupplier`.

## Sources
- [Printful bulk t-shirts](https://www.printful.com/bulk-custom-t-shirts)
- [Printful bulk pricing guide](https://www.printful.com/blog/custom-t-shirts-cost-in-bulk)
- [Printful pricing 2026](https://www.stylefactoryproductions.com/blog/printful-pricing)
- [Printful Gildan 18500 review](https://www.printful.com/blog/gildan-18500-hoodie-review)
- [Printify Gildan 5000](https://printify.com/app/products/6/gildan/unisex-heavy-cotton-tee)
- [FYUL merger](https://www.printmonthly.co.uk/news/business/printful-printify-and-snow-commerce-merge-into-single-brand/)
- [Ninja Transfers DTF cost](https://ninjatransfers.com/pages/how-much-does-dtf-printing-cost)
- [DTF transfer pricing by size](https://ninjatransfers.com/collections/transfers/products/dtf-transfers)
- [DTF printer vs buying transfers](https://dtfprinter.com/dtf-printer-vs-ninja-transfers)
- [S&S Gildan 5000](https://www.ssactivewear.com/p/gildan/5000)
- [S&S Comfort Colors 1717](https://www.ssactivewear.com/p/comfort_colors/1717)
- [Oxford, OH print shops (Yelp)](https://www.yelp.com/search?find_desc=Embroidery+and+Screen+Printing&find_loc=Oxford%2C+OH)
- [Same Day Custom Oxford](https://www.samedaycustom.com/locations/oxford-oh)
- [Real Thread terms](https://www.realthread.com/terms)
- [Screen printing costs 2026](https://rolleduptees.com/blog/how-much-does-screen-printing-cost)
