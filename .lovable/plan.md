

## Add a Profile tab with personal info, wallet, cashback & addresses

Right now `/dashboard` opens "Bookings" by default and the mobile bar's "Profile" link points to `#profile` — but there is no Profile tab, so it just falls back to Bookings. That's why Profile shows booking details.

### What I'll change

**1. Add a real "Profile" tab in `src/routes/dashboard.tsx`**

- Add `<TabsTrigger value="profile">Profile</TabsTrigger>` to the tab list.
- Add a matching `<TabsContent value="profile">` panel with these sections:
  - **Personal info** — name (editable), email (read-only from `user.email`), phone (editable). Save button.
  - **Wallet balance** — ₹0 card with "Coming soon" subtitle (matches existing stat card style).
  - **Cashback earned** — ₹0 card with "Coming soon".
  - **Saved addresses** — same MapPin card content currently under the Addresses tab, shown inline here.
  - **Refer & earn** — referral code block (same as current Refer tab).
  - **Logout** — button calling `supabase.auth.signOut()` then redirect to `/`.

- Remove the now-redundant standalone "Addresses" and "Refer & Earn" tabs (their content moves into Profile). Keep "Bookings", "Orders", "Appliances", "AMC" as separate tabs.

**2. Sync tab with URL hash**

Use `useLocation()` + `useNavigate()` to:
- Read `location.hash` and pass it to `<Tabs value={...}>` so `/dashboard#profile` opens Profile, `/dashboard#bookings` opens Bookings, etc.
- On tab change, `navigate({ hash: newValue })` so the URL stays in sync (this also makes the mobile bar's active-state logic in `MobileBar.tsx` work correctly).
- Default to `bookings` when there's no hash.

**3. Personal info storage**

The DB has no `profiles` table yet. Two options for the editable name/phone:

- **Option A (recommended, in this plan)**: create a `profiles` table:
  ```
  profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text,
    phone text,
    updated_at timestamptz default now()
  )
  ```
  with RLS: users can `select`/`insert`/`update` only their own row (`auth.uid() = id`). Add a trigger on `auth.users` insert to auto-create an empty profile row, mirroring the existing `handle_new_user_role` pattern.
- The Profile tab loads/saves to this table.

**4. No changes needed to `MobileBar.tsx`** — once the Profile tab exists and the dashboard syncs with the hash, clicking Profile will land on the new tab automatically.

### Files touched

- `src/routes/dashboard.tsx` — add Profile tab, hash sync, remove standalone Addresses/Refer tabs.
- New migration — `profiles` table + RLS + auto-insert trigger.

### Out of scope

- Real wallet/cashback logic (kept as "Coming soon" placeholders, as today).
- Multiple saved addresses CRUD (still shows the empty-state card; can be a follow-up).

