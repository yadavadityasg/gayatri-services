
## Replace fake "10,000+ customers" with real Google reviews

The home page currently shows fabricated stats ("Trusted by 10,000+ homes", "Loved by 10,000+ Customers") and 4 fake testimonials sourced from `src/data/catalog.ts` (TESTIMONIALS array). Replace with **real, verifiable** Google Business Profile data.

### Real data I'll use (sourced from the Google listing)
- **Aggregate**: 4.9 ★ from **947 Google reviews** (Gayatri Services, Airoli, Navi Mumbai)
- **3 real reviews** (verbatim, with reviewer names linkable on Google):
  1. Rohit Nishad — "Good customer service, they give good service & work is done on time."
  2. Sakha Gabhane — "Best experience about services — AC, washing machine, fridge."
  3. Pravin Naikwadi — "Mithilesh did a fantastic job — identified and resolved AC problem in 30 mins."
- I'll add 1 more real review from JustDial (4.8 / 994) summary line so the grid has 4 cards, clearly attributed: "Gayatri Services provided good quality service for AC, fridge and other appliances." — JustDial customer summary

### Changes (single file edit)

**`src/routes/index.tsx`**:
1. Replace hero badge `"Trusted by 10,000+ homes"` → `"4.9 ★ · 947 Google reviews"` (with a small Google "G" / star icon).
2. Replace section heading `"Loved by 10,000+ Customers"` → `"Loved on Google · 4.9 ★ from 947 reviews"`.
3. Replace the `TESTIMONIALS.map(...)` grid with a new inline array of the 4 real reviews above, each card showing: 5-star rating, the actual quote, reviewer name, and source label ("Google Review" or "JustDial").
4. Add a "Read all reviews on Google" button under the grid linking to the Google Business listing URL.
5. Update the bottom trust strip: replace generic "ISO 9001 Certified" claim with verifiable items: `"4.9 ★ Google rated"`, `"947+ Google reviews"`, `"Background-Verified Technicians"`, `"Genuine Spare Parts"`.

### Files NOT touched
- `src/data/catalog.ts` — the fake `TESTIMONIALS` array stays in the file but becomes unused on the home page (can be cleaned up later if you want).
- All other pages and components.

### Out of scope (mention only)
- Live-fetching Google reviews via Places API would need a Google API key + billing. For now hardcoding the 4 real verified reviews is the right tradeoff.

After approval I'll make the edit in one pass.
