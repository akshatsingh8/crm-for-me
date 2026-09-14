-- Existing projects may still have NOT NULL constraints from an older table.
-- Keep identity, name, phone, and created_at required; all lead details are optional.
alter table public.real_estate_clients
  alter column email drop not null,
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
