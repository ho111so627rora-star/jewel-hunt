create table if not exists public.jewel_rooms (
  code text primary key check (code ~ '^[A-Z2-9]{6}$'),
  payload jsonb not null,
  version bigint not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.jewel_rooms enable row level security;
revoke all on table public.jewel_rooms from anon, authenticated;
grant select, insert, update, delete on table public.jewel_rooms to service_role;
comment on table public.jewel_rooms is 'Private room state. Only the jewel-rooms Edge Function may read and update it.';
