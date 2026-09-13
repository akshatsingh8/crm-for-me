create extension if not exists pgcrypto with schema extensions;

create table public.real_estate_clients (
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

comment on table public.real_estate_clients is 'Real estate leads, requirements, budgets, and follow-up details.';

create index real_estate_clients_created_at_idx
  on public.real_estate_clients (created_at desc);

alter table public.real_estate_clients enable row level security;

revoke all on table public.real_estate_clients from anon, authenticated;
grant select, insert on table public.real_estate_clients to anon;
grant usage, select on sequence public.real_estate_clients_id_seq to anon;

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
