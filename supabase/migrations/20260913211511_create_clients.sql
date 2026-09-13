create extension if not exists pgcrypto with schema extensions;

create table if not exists public.real_estate_clients (
  id bigint generated always as identity primary key,
  name text not null,
  phone text not null,
  email text,
  requirement text check (requirement in ('Buy', 'Rent', 'Sell')),
  property_type text check (property_type in ('Apartment', 'Villa', 'Plot', 'Commercial', 'Office', 'Other')),
  property_project text,
  preferred_location text,
  budget_min numeric(14, 2) check (budget_min is null or budget_min >= 0),
  budget_max numeric(14, 2) check (budget_max is null or budget_max >= 0),
  lead_source text
    check (lead_source in ('Referral', 'Website', 'Portal', 'Social media', 'Walk-in', 'Other')),
  lead_temperature text
    check (lead_temperature in ('Hot', 'Warm', 'Cold')),
  status text
    check (status in ('New', 'Contacted', 'Site visit', 'Negotiation', 'Closed won', 'Closed lost')),
  follow_up_date date,
  notes text,
  created_at timestamptz not null default now(),
  constraint real_estate_clients_budget_range_check
    check (budget_min is null or budget_max is null or budget_max >= budget_min)
);

-- Reconcile a table left behind by an earlier or partial SQL Editor run.
-- These statements preserve existing rows and are safe to execute repeatedly.
alter table public.real_estate_clients
  add column if not exists name text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists requirement text,
  add column if not exists property_type text,
  add column if not exists property_project text,
  add column if not exists preferred_location text,
  add column if not exists budget_min numeric(14, 2),
  add column if not exists budget_max numeric(14, 2),
  add column if not exists lead_source text,
  add column if not exists lead_temperature text,
  add column if not exists status text,
  add column if not exists follow_up_date date,
  add column if not exists notes text,
  add column if not exists created_at timestamptz not null default now();

alter table public.real_estate_clients
  alter column requirement drop not null,
  alter column property_type drop not null,
  alter column property_project drop not null,
  alter column preferred_location drop not null,
  alter column budget_min drop not null,
  alter column budget_max drop not null,
  alter column lead_source drop not null,
  alter column lead_temperature drop not null,
  alter column status drop not null,
  alter column follow_up_date drop not null,
  alter column notes drop not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'real_estate_clients_requirement_check'
      and conrelid = 'public.real_estate_clients'::regclass
  ) then
    alter table public.real_estate_clients
      add constraint real_estate_clients_requirement_check
      check (requirement in ('Buy', 'Rent', 'Sell'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'real_estate_clients_property_type_check'
      and conrelid = 'public.real_estate_clients'::regclass
  ) then
    alter table public.real_estate_clients
      add constraint real_estate_clients_property_type_check
      check (property_type in ('Apartment', 'Villa', 'Plot', 'Commercial', 'Office', 'Other'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'real_estate_clients_budget_min_check'
      and conrelid = 'public.real_estate_clients'::regclass
  ) then
    alter table public.real_estate_clients
      add constraint real_estate_clients_budget_min_check
      check (budget_min is null or budget_min >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'real_estate_clients_budget_max_check'
      and conrelid = 'public.real_estate_clients'::regclass
  ) then
    alter table public.real_estate_clients
      add constraint real_estate_clients_budget_max_check
      check (budget_max is null or budget_max >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'real_estate_clients_lead_source_check'
      and conrelid = 'public.real_estate_clients'::regclass
  ) then
    alter table public.real_estate_clients
      add constraint real_estate_clients_lead_source_check
      check (lead_source in ('Referral', 'Website', 'Portal', 'Social media', 'Walk-in', 'Other'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'real_estate_clients_lead_temperature_check'
      and conrelid = 'public.real_estate_clients'::regclass
  ) then
    alter table public.real_estate_clients
      add constraint real_estate_clients_lead_temperature_check
      check (lead_temperature in ('Hot', 'Warm', 'Cold'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'real_estate_clients_status_check'
      and conrelid = 'public.real_estate_clients'::regclass
  ) then
    alter table public.real_estate_clients
      add constraint real_estate_clients_status_check
      check (status in ('New', 'Contacted', 'Site visit', 'Negotiation', 'Closed won', 'Closed lost'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'real_estate_clients_budget_range_check'
      and conrelid = 'public.real_estate_clients'::regclass
  ) then
    alter table public.real_estate_clients
      add constraint real_estate_clients_budget_range_check
      check (budget_min is null or budget_max is null or budget_max >= budget_min);
  end if;
end $$;

comment on table public.real_estate_clients is 'Real estate leads, requirements, budgets, and follow-up details.';

create index if not exists real_estate_clients_created_at_idx
  on public.real_estate_clients (created_at desc);

alter table public.real_estate_clients enable row level security;

revoke all on table public.real_estate_clients from anon, authenticated;
grant select, insert on table public.real_estate_clients to anon;
grant usage, select on sequence public.real_estate_clients_id_seq to anon;

drop policy if exists "CRM server can read real estate clients"
  on public.real_estate_clients;

create policy "CRM server can read real estate clients"
on public.real_estate_clients
for select
to anon
using (
  encode(
    extensions.digest(
      coalesce(current_setting('request.headers', true)::jsonb ->> 'x-crm-access-token', ''),
      'sha256'
    ),
    'hex'
  ) = '32316318ab79384b32f1a54216d1ecd086d87e89e830d2a05b20a5e62f37baa8'
);

drop policy if exists "CRM server can add real estate clients"
  on public.real_estate_clients;

create policy "CRM server can add real estate clients"
on public.real_estate_clients
for insert
to anon
with check (
  encode(
    extensions.digest(
      coalesce(current_setting('request.headers', true)::jsonb ->> 'x-crm-access-token', ''),
      'sha256'
    ),
    'hex'
  ) = '32316318ab79384b32f1a54216d1ecd086d87e89e830d2a05b20a5e62f37baa8'
);
