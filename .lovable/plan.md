

## Why admin updates don't show on the site

**Root cause**: The customer-facing `/shop` and `/shop/$id` routes import products from a **hardcoded array** in `src/data/catalog.ts`. The `/admin` portal reads/writes the `products` table in the database. The two are completely disconnected — the shop never queries the database, so admin edits are invisible.

Same issue applies to **services**, **AMC plans**, and **technicians** — admin writes to DB tables, but the public pages all read from `catalog.ts` constants.

## Fix: make public pages read from the database

Convert the public routes to load data from Supabase via TanStack Router loaders + TanStack Query, with `catalog.ts` constants kept only as a static fallback for filter options (categories, brands list).

### Routes to migrate

| Route | Currently reads | Change to |
|---|---|---|
| `src/routes/shop.tsx` | `PRODUCTS` from catalog | `supabase.from("products").select("*").eq("active", true)` |
| `src/routes/shop.$id.tsx` | `PRODUCTS.find(...)` in loader | `supabase.from("products").select("*").eq("id", params.id).single()` in loader |
| `src/routes/services.tsx` | `SERVICES` from catalog | `supabase.from("services").select("*").eq("active", true)` |
| `src/routes/services.$slug.tsx` | `SERVICES.find(...)` | `supabase.from("services").select("*").eq("slug", params.slug).single()` |
| `src/routes/amc.tsx` | `AMC_PLANS` from catalog | `supabase.from("amc_plans").select("*").eq("active", true).order("sort_order")` |
| `src/routes/technician.$id.tsx` | `TECHNICIANS.find(...)` | `supabase.from("technicians").select("*").eq("id", params.id).single()` |
| `src/routes/index.tsx` (if it lists products/services) | catalog constants | DB query |
| `src/routes/search.tsx` | catalog constants | DB queries |

### Implementation approach

1. **Use TanStack Router loaders** for SSR + initial data, with the existing `queryClient` from `__root.tsx` context. This keeps SEO working and gives you fast first paint.

2. **Field name mapping**: DB uses `snake_case` (`category_label`, `starting_at`, `energy_rating`), TS types use `camelCase`. Either:
   - Update the TS interfaces in `catalog.ts` to use snake_case to match DB rows directly (simpler, fewer transforms), OR
   - Add a small mapper function that converts row → typed object.
   
   Recommend **snake_case** to match the database — fewer moving parts.

3. **Loader pattern** (per route):
   ```ts
   loader: async ({ params }) => {
     const { data, error } = await supabase
       .from("products").select("*").eq("id", params.id).single();
     if (error || !data) throw notFound();
     return { product: data };
   }
   ```

4. **List pages**: use a loader that returns all active rows. No pagination needed at current scale.

5. **Keep `catalog.ts` constants only for**:
   - `CATEGORIES` (static list used in filters)
   - `BRANDS` (can also be derived from product rows — `[...new Set(products.map(p=>p.brand))]`)

6. **404 handling**: detail routes already have `notFoundComponent` — keep it, just make sure `notFound()` is thrown when the DB query returns no row.

### After the migration

- Editing any product/service/AMC/technician in `/admin` → Save → reload the public page → change appears immediately.
- The image URL update for P001 will start showing on the site.
- No more drift between admin DB and the static mock file.

### Out of scope (separate follow-ups if you want)
- Realtime updates (no need to reload — uses Supabase Realtime).
- Removing `catalog.ts` constants entirely (can do once everything is verified working from DB).
- Image upload UI in admin (you currently paste URLs).

