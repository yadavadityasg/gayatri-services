-- Local schema for the app container. Plain Postgres, no Supabase auth schema.
create extension if not exists pgcrypto;

create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.products (
  id text primary key,
  name text not null,
  brand text not null,
  category text not null,
  condition text not null default 'New',
  price integer not null,
  mrp integer not null,
  rating numeric(2,1) not null default 4.5,
  reviews integer not null default 0,
  image text not null,
  capacity text,
  energy_rating integer,
  description text not null default '',
  specs jsonb not null default '[]'::jsonb,
  box jsonb not null default '[]'::jsonb,
  warranty text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  slug text primary key,
  category text not null,
  category_label text not null,
  name text not null,
  short text not null,
  starting_at integer not null,
  duration text not null,
  icon text not null default 'wrench',
  includes jsonb not null default '[]'::jsonb,
  problems jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.amc_plans (
  id text primary key,
  name text not null,
  price integer not null,
  period text not null default 'year',
  appliances text not null,
  services text not null,
  tagline text not null default '',
  highlight boolean not null default false,
  benefits jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.technicians (
  id text primary key,
  name text not null,
  specialization text not null,
  experience integer not null default 0,
  rating numeric(2,1) not null default 4.5,
  jobs integer not null default 0,
  on_time integer not null default 95,
  photo text not null default '',
  certifications jsonb not null default '[]'::jsonb,
  rating_breakdown jsonb not null default '[0,0,0,0,0]'::jsonb,
  reviews jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.technician_tasks (
  id uuid primary key default gen_random_uuid(),
  technician_id text not null references public.technicians(id) on delete cascade,
  customer_name text not null,
  customer_phone text not null default '',
  problem text not null,
  details text not null default '',
  address text not null,
  map_url text not null default '',
  voice_note_url text not null default '',
  completion_comment text not null default '',
  completion_voice_url text not null default '',
  visit_date date,
  visit_time text not null default '',
  time_slot text not null default '',
  priority text not null default 'normal' check (priority in ('normal', 'urgent')),
  status text not null default 'assigned' check (status in ('assigned', 'accepted', 'on_the_way', 'completed', 'cancelled')),
  notification_status text not null default 'pending' check (notification_status in ('pending', 'sent')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists technician_tasks_tech_idx
  on public.technician_tasks (technician_id, created_at desc);

create table if not exists public.technician_notifications (
  id uuid primary key default gen_random_uuid(),
  technician_id text not null references public.technicians(id) on delete cascade,
  task_id uuid references public.technician_tasks(id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  delivered_at timestamptz
);

create table if not exists public.technician_accounts (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  technician_id text not null references public.technicians(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.technician_sessions (
  id text primary key,
  account_id uuid not null references public.technician_accounts(id) on delete cascade,
  expires_at timestamptz not null
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
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

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
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

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now()
);

create table if not exists public.sessions (
  id text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  expires_at timestamptz not null
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role text not null check (role in ('admin', 'user')),
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products
  for each row execute function public.update_updated_at_column();
drop trigger if exists services_updated_at on public.services;
create trigger services_updated_at before update on public.services
  for each row execute function public.update_updated_at_column();
drop trigger if exists amc_updated_at on public.amc_plans;
create trigger amc_updated_at before update on public.amc_plans
  for each row execute function public.update_updated_at_column();
drop trigger if exists technicians_updated_at on public.technicians;
create trigger technicians_updated_at before update on public.technicians
  for each row execute function public.update_updated_at_column();
drop trigger if exists technician_tasks_updated on public.technician_tasks;
create trigger technician_tasks_updated before update on public.technician_tasks
  for each row execute function public.update_updated_at_column();
drop trigger if exists bookings_updated on public.bookings;
create trigger bookings_updated before update on public.bookings
  for each row execute function public.update_updated_at_column();
drop trigger if exists orders_updated on public.orders;
create trigger orders_updated before update on public.orders
  for each row execute function public.update_updated_at_column();
