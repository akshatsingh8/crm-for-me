alter table public.real_estate_clients
  add column if not exists calling_status text not null default 'Uncalled',
  add column if not exists last_called_at timestamptz;

alter table public.real_estate_clients
  add constraint real_estate_clients_calling_status_check
  check (calling_status in ('Uncalled', 'Contacted', 'Did not connect'));

create table public.lead_activities (
  id bigint generated always as identity primary key,
  lead_id bigint not null references public.real_estate_clients(id) on delete cascade,
  kind text not null check (kind in ('call', 'whatsapp', 'note', 'status_change')),
  outcome text,
  details text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint lead_activities_call_outcome_check check (
    kind <> 'call' or outcome in ('Contacted', 'Did not connect')
  )
);

create index lead_activities_lead_time_idx
  on public.lead_activities (lead_id, occurred_at desc, id desc);

alter table public.lead_activities enable row level security;
revoke all on public.lead_activities from anon, authenticated;
grant select, insert on public.lead_activities to anon;
grant usage, select on sequence public.lead_activities_id_seq to anon;

create policy "CRM server can read lead activities"
on public.lead_activities for select to anon
using (
  encode(extensions.digest(coalesce(current_setting('request.headers', true)::jsonb ->> 'x-crm-access-token', ''), 'sha256'), 'hex') = '32316318ab79384b32f1a54216d1ecd086d87e89e830d2a05b20a5e62f37baa8'
);

create policy "CRM server can add lead activities"
on public.lead_activities for insert to anon
with check (
  encode(extensions.digest(coalesce(current_setting('request.headers', true)::jsonb ->> 'x-crm-access-token', ''), 'sha256'), 'hex') = '32316318ab79384b32f1a54216d1ecd086d87e89e830d2a05b20a5e62f37baa8'
);

-- A single RPC keeps the call result, lead status, and timeline entry in one transaction.
create function public.record_lead_call(
  p_lead_id bigint,
  p_outcome text,
  p_details text,
  p_lead_status text,
  p_follow_up_date date,
  p_called_at timestamptz
) returns void
language plpgsql security invoker set search_path = ''
as $$
declare
  v_lead_id bigint;
begin
  if p_outcome not in ('Contacted', 'Did not connect') then
    raise exception 'Invalid call outcome';
  end if;
  if p_lead_status is not null and p_lead_status not in ('New', 'Contacted', 'Site visit', 'Negotiation', 'Closed won', 'Closed lost') then
    raise exception 'Invalid lead status';
  end if;
  if p_outcome = 'Contacted' and nullif(btrim(p_details), '') is null then
    raise exception 'Please describe the conversation';
  end if;
  if p_called_at is null or p_called_at < now() - interval '1 day' or p_called_at > now() + interval '5 minutes' then
    raise exception 'Invalid call time';
  end if;

  update public.real_estate_clients
  set calling_status = p_outcome,
      last_called_at = p_called_at,
      status = coalesce(p_lead_status, status),
      follow_up_date = coalesce(p_follow_up_date, follow_up_date)
  where id = p_lead_id
  returning id into v_lead_id;

  if v_lead_id is null then
    raise exception 'Lead not found';
  end if;

  insert into public.lead_activities (lead_id, kind, outcome, details, occurred_at)
  values (p_lead_id, 'call', p_outcome, nullif(btrim(p_details), ''), p_called_at);
end;
$$;

revoke all on function public.record_lead_call(bigint, text, text, text, date, timestamptz) from public, authenticated;
grant execute on function public.record_lead_call(bigint, text, text, text, date, timestamptz) to anon;

-- Record status changes from both the existing lead editor and the calling workflow.
create function public.log_lead_status_change()
returns trigger
language plpgsql security invoker set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    insert into public.lead_activities (lead_id, kind, details)
    values (new.id, 'status_change',
      'Status changed from ' || coalesce(old.status, 'Not specified') || ' to ' || coalesce(new.status, 'Not specified'));
  end if;
  return new;
end;
$$;

create trigger log_lead_status_change
after update of status on public.real_estate_clients
for each row execute function public.log_lead_status_change();
