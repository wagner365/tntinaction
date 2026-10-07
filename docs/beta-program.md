# Beta program: Founding Clubs

**The plan:** free merch for two Founding Clubs before the public launch:
1. **Applied AI Club** (first)
2. **Side Hustle Club** (second)

You pay for the shirts as a marketing cost. In return you get real photos, testimonials, a working order process, and two clubs full of people who can refer you.

## What "free" will cost you
Estimates from `npm run compare`, classic tee with a 1-color front print:

| Members claiming | Printful | DTF yourself |
|---|---|---|
| 20 | ~$200 ($10/tee, no bulk discount under 25) | ~$124 |
| 30 | ~$256 ($8.52/tee) | ~$186 ($6.20/tee) |
| 50 | ~$384 ($7.69/tee) | ~$295 ($5.90/tee) |

Both clubs at about 30 members each comes to **roughly $370–510**. To control cost:
- **Cap it:** "Free for the first 25 members who claim," or one per member.
- **Fit the timing:** if you plan to buy a heat press anyway, these orders are good practice and the press pays for itself.
- **Track it** as a marketing expense in your Northern Threads books (it's deductible as an advertising cost; ask an accountant).

## What you ask for in return
Make it explicit when you offer. Clubs are happy to say yes when the ask is clear:
- A **group photo** in the merch, OK to post on your Instagram and website
- A **2-sentence testimonial** from the club president
- **5 minutes at a meeting**, or a post in their GroupMe, announcing that you do merch for other clubs
- **Introductions** to 2–3 other club leaders they know

## Message to the Applied AI Club president
> Hey [name]! I run The Northern Threads, a student apparel brand, and I'm launching custom merch for Miami clubs. I'd love for Applied AI Club to be my first Founding Club: **free custom tees for members**, designed for the club, with sizes collected on a simple order page and everything handed out at a meeting.
>
> All I'd ask in return is a group photo in the shirts and a quick shout-out to other club leaders. Want me to put together a free design mockup this week?

Use the same message for Side Hustle Club, adjusted since you're a member: "...as a member I'd love for Side Hustle to be my second Founding Club..."

## Running a free order
1. **Design.** Get the club's logo or idea, send a mockup within 24 hours, and get approval.
2. **Claim form.** Create a Google Form with: Name, Email, Size (dropdown: S/M/L/XL/2XL). Turn on "Limit to 1 response" if you're capping one per member.
3. **Order page.** Paste the form link into `claimLink` in `stores/applied-ai-club.json`, and set `closes` to the real deadline. Share:
   `https://wagner365.github.io/tntinaction/store.html?s=applied-ai-club`
4. **Close.** In the Google Form go to **Responses → Download CSV**, then run:
   `node scripts/size-report.mjs responses.csv --out printer-sheet.csv`
5. **Order and deliver.** Place the supplier order, bag the shirts by name, hand them out at the meeting, and **take the photo**.
6. **Follow up within a week:** collect the testimonial and ask:
   - What did members think of the quality and fit?
   - Would the club pay for a second design (hoodies, crewnecks) later in the year?
   - Who else should I talk to?

## After the Founding Clubs
- Put the photos and testimonials on the homepage. That's the first upgrade to the site.
- Start charging normal prices from club #3 on.
- Offer the Founding Clubs a fundraiser order for their next design. That's how free turns into paid.

## Track it
| Club | Contact | Pieces | Your cost | Days to deliver | Photo? | Testimonial? | Referrals |
|---|---|---|---|---|---|---|---|
| Applied AI Club | | | | | | | |
| Side Hustle Club | | | | | | | |
