-- Are We Compatible? — reference copy of migration 8 in src/lib/server/db/schema.ts.
-- The app applies it automatically on first use; this file is for reference only.

create table if not exists compat_assessments (
  id uuid primary key,
  context text not null,
  question_set text not null,
  scoring_version text not null,
  invite_token_hash text not null unique,
  unlocked_at timestamptz,
  unlock_order_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists compat_assessments_expires_idx on compat_assessments (expires_at);
create table if not exists compat_participants (
  id uuid primary key,
  assessment_id uuid not null references compat_assessments (id) on delete cascade,
  role text not null check (role in ('a', 'b')),
  name text not null,
  token_hash text not null unique,
  answers jsonb not null default '{}'::jsonb,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assessment_id, role)
);
create table if not exists compat_orders (
  id uuid primary key,
  number text not null unique,
  assessment_id uuid references compat_assessments (id) on delete set null,
  buyer_role text check (buyer_role in ('a', 'b')),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
  currency text not null,
  amount_total integer not null,
  provider text not null,
  provider_session_id text,
  provider_payment_id text,
  receipt_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz,
  refunded_at timestamptz
);
create index if not exists compat_orders_assessment_idx on compat_orders (assessment_id);
create index if not exists compat_orders_session_idx on compat_orders (provider_session_id);
alter table compat_assessments enable row level security;
alter table compat_participants enable row level security;
alter table compat_orders enable row level security;
