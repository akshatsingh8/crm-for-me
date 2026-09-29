alter table public.real_estate_clients
  drop constraint real_estate_clients_status_check;

alter table public.real_estate_clients
  add constraint real_estate_clients_status_check
  check (status in (
    'New', 'Contacted', 'Interested', 'Nurturing', 'Future potential',
    'Site visit', 'Negotiation', 'Closed won', 'Not interested', 'Closed lost'
  ));

create or replace function public.record_lead_call(
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
  if p_lead_status is not null and p_lead_status not in (
    'New', 'Contacted', 'Interested', 'Nurturing', 'Future potential',
    'Site visit', 'Negotiation', 'Closed won', 'Not interested', 'Closed lost'
  ) then
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
