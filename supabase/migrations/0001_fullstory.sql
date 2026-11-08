-- FULLSTORY schema. Generated from src/lib/server/db/schema.ts.
-- The app applies these automatically on first database use; this file is for reference / manual setup.

-- 1: init
create table if not exists local_users (
  id uuid primary key,
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  user_id uuid primary key,
  email text not null,
  full_name text,
  currency text,
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists projects (
  id uuid primary key,
  user_id uuid not null,
  title text not null,
  template_id text,
  status text not null default 'draft' check (status in ('draft', 'completed', 'archived')),
  document jsonb not null,
  version integer not null default 1,
  page_count integer not null default 0,
  size_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists projects_user_idx on projects (user_id, updated_at desc);

create table if not exists photos (
  id uuid primary key,
  user_id uuid not null,
  project_id uuid not null references projects (id) on delete cascade,
  filename text not null,
  content_type text not null,
  size_bytes bigint not null default 0,
  width integer not null,
  height integer not null,
  storage_prefix text not null,
  original_ext text not null,
  status text not null default 'pending' check (status in ('pending', 'ready')),
  created_at timestamptz not null default now()
);
create index if not exists photos_project_idx on photos (project_id, created_at);

create table if not exists orders (
  id uuid primary key,
  number text not null unique,
  user_id uuid not null,
  project_id uuid not null references projects (id),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
  currency text not null,
  items jsonb not null,
  lines jsonb not null,
  amount_subtotal integer not null,
  amount_shipping integer not null default 0,
  amount_total integer not null,
  provider text not null,
  provider_session_id text,
  provider_payment_id text,
  receipt_url text,
  document_snapshot jsonb not null,
  shipping_address jsonb,
  fulfillment_status text check (fulfillment_status in ('awaiting_payment', 'processing', 'in_production', 'shipped', 'delivered', 'cancelled')),
  carrier text,
  tracking_number text,
  tracking_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz,
  refunded_at timestamptz
);
create index if not exists orders_user_idx on orders (user_id, created_at desc);
create index if not exists orders_session_idx on orders (provider_session_id);

create table if not exists order_events (
  id bigserial primary key,
  order_id uuid not null references orders (id) on delete cascade,
  type text not null,
  data jsonb,
  created_at timestamptz not null default now()
);
create index if not exists order_events_order_idx on order_events (order_id, created_at);

create table if not exists exports (
  id uuid primary key,
  order_id uuid not null references orders (id) on delete cascade,
  kind text not null check (kind in ('digital', 'print-interior', 'print-cover')),
  status text not null default 'pending' check (status in ('pending', 'ready', 'failed')),
  storage_key text,
  size_bytes bigint,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, kind)
);

create table if not exists shares (
  id uuid primary key,
  token text not null unique,
  order_id uuid not null unique references orders (id) on delete cascade,
  user_id uuid not null,
  project_id uuid not null,
  title text not null,
  access text not null default 'link' check (access in ('link', 'password')),
  password_hash text,
  enabled boolean not null default true,
  allow_download boolean not null default false,
  expires_at timestamptz,
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists shares_user_idx on shares (user_id);

create table if not exists webhook_events (
  provider text not null,
  event_id text not null,
  received_at timestamptz not null default now(),
  primary key (provider, event_id)
);

alter table local_users enable row level security;
alter table profiles enable row level security;
alter table projects enable row level security;
alter table photos enable row level security;
alter table orders enable row level security;
alter table order_events enable row level security;
alter table exports enable row level security;
alter table shares enable row level security;
alter table webhook_events enable row level security;;

-- 2: order-photo-manifest
alter table orders add column if not exists photo_manifest jsonb not null default '{}'::jsonb;
alter table orders add column if not exists customer_email text;
alter table orders add column if not exists print_options jsonb;
