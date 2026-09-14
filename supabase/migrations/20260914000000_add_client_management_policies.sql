-- Permit authenticated CRM server actions to change and remove leads.
grant update, delete on table public.real_estate_clients to anon;

drop policy if exists "CRM server can update real estate clients"
  on public.real_estate_clients;

create policy "CRM server can update real estate clients"
on public.real_estate_clients
for update
to anon
using (
  encode(extensions.digest(coalesce(current_setting('request.headers', true)::jsonb ->> 'x-crm-access-token', ''), 'sha256'), 'hex') = '32316318ab79384b32f1a54216d1ecd086d87e89e830d2a05b20a5e62f37baa8'
)
with check (
  encode(extensions.digest(coalesce(current_setting('request.headers', true)::jsonb ->> 'x-crm-access-token', ''), 'sha256'), 'hex') = '32316318ab79384b32f1a54216d1ecd086d87e89e830d2a05b20a5e62f37baa8'
);

drop policy if exists "CRM server can delete real estate clients"
  on public.real_estate_clients;

create policy "CRM server can delete real estate clients"
on public.real_estate_clients
for delete
to anon
using (
  encode(extensions.digest(coalesce(current_setting('request.headers', true)::jsonb ->> 'x-crm-access-token', ''), 'sha256'), 'hex') = '32316318ab79384b32f1a54216d1ecd086d87e89e830d2a05b20a5e62f37baa8'
);
