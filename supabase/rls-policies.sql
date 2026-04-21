-- ============================================================
-- Gayatri Services — Supabase RLS Policies
-- Run this once in the Supabase SQL Editor (Dashboard > SQL)
-- ============================================================

-- ── 1. bookings ──────────────────────────────────────────────
alter table public.bookings enable row level security;

-- Users can only see their own bookings
create policy "bookings: select own"
  on public.bookings for select
  using (auth.uid() = user_id);

-- Users can only insert bookings for themselves
create policy "bookings: insert own"
  on public.bookings for insert
  with check (auth.uid() = user_id);

-- Users cannot update or delete their own bookings (admin only via service role)
-- (No update/delete policies = denied for anon/authenticated roles)

-- ── 2. orders ────────────────────────────────────────────────
alter table public.orders enable row level security;

create policy "orders: select own"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "orders: insert own"
  on public.orders for insert
  with check (auth.uid() = user_id);

-- ── 3. user_roles ────────────────────────────────────────────
alter table public.user_roles enable row level security;

-- Users can read their own role (needed for the admin check in the UI)
create policy "user_roles: select own"
  on public.user_roles for select
  using (auth.uid() = user_id);

-- NOBODY can insert/update/delete roles from the client
-- (Must be done via service-role key or Supabase dashboard)

-- ── Helper: is_admin() function ──────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

-- ── 4. products ──────────────────────────────────────────────
alter table public.products enable row level security;

-- Anyone (including anonymous) can read active products
create policy "products: public select"
  on public.products for select
  using (active = true or public.is_admin());

-- Only admins can insert/update/delete
create policy "products: admin insert"
  on public.products for insert
  with check (public.is_admin());

create policy "products: admin update"
  on public.products for update
  using (public.is_admin());

create policy "products: admin delete"
  on public.products for delete
  using (public.is_admin());

-- ── 5. services ──────────────────────────────────────────────
alter table public.services enable row level security;

create policy "services: public select"
  on public.services for select
  using (active = true or public.is_admin());

create policy "services: admin insert"
  on public.services for insert
  with check (public.is_admin());

create policy "services: admin update"
  on public.services for update
  using (public.is_admin());

create policy "services: admin delete"
  on public.services for delete
  using (public.is_admin());

-- ── 6. amc_plans ─────────────────────────────────────────────
alter table public.amc_plans enable row level security;

create policy "amc_plans: public select"
  on public.amc_plans for select
  using (active = true or public.is_admin());

create policy "amc_plans: admin insert"
  on public.amc_plans for insert
  with check (public.is_admin());

create policy "amc_plans: admin update"
  on public.amc_plans for update
  using (public.is_admin());

create policy "amc_plans: admin delete"
  on public.amc_plans for delete
  using (public.is_admin());

-- ── 7. technicians ───────────────────────────────────────────
alter table public.technicians enable row level security;

create policy "technicians: public select"
  on public.technicians for select
  using (active = true or public.is_admin());

create policy "technicians: admin insert"
  on public.technicians for insert
  with check (public.is_admin());

create policy "technicians: admin update"
  on public.technicians for update
  using (public.is_admin());

create policy "technicians: admin delete"
  on public.technicians for delete
  using (public.is_admin());
