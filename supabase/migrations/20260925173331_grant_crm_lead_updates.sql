-- PostgREST checks table privileges before evaluating CRM RLS policies.
-- Reuse the existing read policy's private-header check for writes so this
-- repair does not copy the access-token hash into another migration.
alter table public.real_estate_clients enable row level security;
grant update, delete on table public.real_estate_clients to anon;

do $$
declare
  gate text;
begin
  select qual into gate
  from pg_policies
  where schemaname = 'public'
    and tablename = 'real_estate_clients'
    and policyname = 'CRM server can read real estate clients'
    and cmd = 'SELECT';

  if gate is null or position('x-crm-access-token' in gate) = 0 then
    raise exception 'The CRM read policy is missing its private-header check. Apply the earlier CRM policy migration first.';
  end if;

  drop policy if exists "CRM server can update real estate clients" on public.real_estate_clients;
  execute format(
    'create policy "CRM server can update real estate clients" on public.real_estate_clients for update to anon using (%s) with check (%s)',
    gate, gate
  );

  drop policy if exists "CRM server can delete real estate clients" on public.real_estate_clients;
  execute format(
    'create policy "CRM server can delete real estate clients" on public.real_estate_clients for delete to anon using (%s)',
    gate
  );
end $$;
