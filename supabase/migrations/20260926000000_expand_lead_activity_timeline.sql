-- Extend the existing guarded activity table without adding API privileges.
alter table public.lead_activities
  drop constraint lead_activities_kind_check;

alter table public.lead_activities
  add constraint lead_activities_kind_check
  check (kind in ('call', 'whatsapp', 'note', 'status_change', 'site_visit', 'follow_up'));

-- The existing CRM header-gated INSERT policy applies to these events.
create function public.log_lead_follow_up_change()
returns trigger
language plpgsql security invoker set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.follow_up_date is not null then
      insert into public.lead_activities (lead_id, kind, outcome, details)
      values (new.id, 'follow_up', 'Scheduled', 'Follow-up scheduled for ' || new.follow_up_date::text);
    end if;
  elsif new.follow_up_date is distinct from old.follow_up_date then
    insert into public.lead_activities (lead_id, kind, outcome, details)
    values (
      new.id,
      'follow_up',
      case when new.follow_up_date is null then 'Cleared'
           when old.follow_up_date is null then 'Scheduled'
           else 'Rescheduled' end,
      case when new.follow_up_date is null then 'Follow-up date cleared (was ' || old.follow_up_date::text || ')'
           when old.follow_up_date is null then 'Follow-up scheduled for ' || new.follow_up_date::text
           else 'Follow-up moved from ' || old.follow_up_date::text || ' to ' || new.follow_up_date::text end
    );
  end if;
  return new;
end;
$$;

create trigger log_lead_follow_up_change
after insert or update of follow_up_date on public.real_estate_clients
for each row execute function public.log_lead_follow_up_change();
