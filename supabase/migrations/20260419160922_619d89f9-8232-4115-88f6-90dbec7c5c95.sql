-- Bookings, orders, and reviews
create extension if not exists pgcrypto;

create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql set search_path = public;

-- Repair bookings
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  service_slug text not null,
  service_name text not null,
  brand text,
  problem text,
  description text,
  preferred_date date not null,
  time_slot text not null,
  address_line text not null,
  floor_landmark text,
  city text,
  pincode text,
  visit_charge integer not null default 299,
  status text not null default 'booked',
  technician_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.bookings enable row level security;
create policy "Users select own bookings" on public.bookings for select using (auth.uid() = user_id);
create policy "Users insert own bookings" on public.bookings for insert with check (auth.uid() = user_id);
create policy "Users update own bookings" on public.bookings for update using (auth.uid() = user_id);
create policy "Users delete own bookings" on public.bookings for delete using (auth.uid() = user_id);
create trigger bookings_updated before update on public.bookings for each row execute function public.update_updated_at_column();
create index bookings_user_idx on public.bookings(user_id, created_at desc);

-- Product orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  items jsonb not null,
  subtotal integer not null,
  delivery_fee integer not null default 0,
  discount integer not null default 0,
  gst integer not null default 0,
  total integer not null,
  status text not null default 'placed',
  payment_method text not null,
  address jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.orders enable row level security;
create policy "Users select own orders" on public.orders for select using (auth.uid() = user_id);
create policy "Users insert own orders" on public.orders for insert with check (auth.uid() = user_id);
create policy "Users update own orders" on public.orders for update using (auth.uid() = user_id);
create trigger orders_updated before update on public.orders for each row execute function public.update_updated_at_column();
create index orders_user_idx on public.orders(user_id, created_at desc);
