-- Run once in the Supabase SQL editor or with `supabase db push`.
-- No service-role key is required by the application.
begin;
create table if not exists public.health_records (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  revision integer not null default 1 check (revision > 0),
  updated_at timestamptz not null default now(),
  constraint valid_data check (
    jsonb_typeof(data) = 'object' and data ->> 'version' = '1'
    and jsonb_typeof(data -> 'entries') = 'array'
    and jsonb_typeof(data -> 'water') = 'array'
    and octet_length(data::text) <= 2097152
  )
);
alter table public.health_records enable row level security;
revoke all on public.health_records from anon;
grant select, insert, update, delete on public.health_records to authenticated;
create policy "Read own health records" on public.health_records
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Insert own health records" on public.health_records
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own health records" on public.health_records
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Delete own health records" on public.health_records
  for delete to authenticated using ((select auth.uid()) = user_id);
create function public.health_records_before_write() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  if tg_op = 'UPDATE' then new.revision = old.revision + 1;
  else new.revision = 1;
  end if;
  return new;
end;
$$;
create trigger health_records_version before insert or update on public.health_records
  for each row execute function public.health_records_before_write();
commit;
