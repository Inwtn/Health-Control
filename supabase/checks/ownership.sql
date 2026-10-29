-- Execute after the migration in an isolated Supabase development project.
-- This test uses real PostgreSQL roles, JWT claims and RLS; all fixtures roll back.
begin;
insert into auth.users (id, email) values
  ('e136f6d3-d18d-4321-927f-000000000001', 'hc-rls-one@example.test'),
  ('e136f6d3-d18d-4321-927f-000000000002', 'hc-rls-two@example.test');
set local role authenticated;
select set_config('request.jwt.claim.sub', 'e136f6d3-d18d-4321-927f-000000000001', true);
insert into public.health_records(user_id, data) values
  ('e136f6d3-d18d-4321-927f-000000000001', '{"version":1,"entries":[],"water":[]}');
do $$ begin
  if (select count(*) from public.health_records) <> 1 then raise exception 'Owner could not read own row'; end if;
end $$;
select set_config('request.jwt.claim.sub', 'e136f6d3-d18d-4321-927f-000000000002', true);
do $$ begin
  if exists(select 1 from public.health_records) then raise exception 'Cross-user read allowed'; end if;
  update public.health_records set data = '{"version":1,"entries":[],"water":[]}' where user_id = 'e136f6d3-d18d-4321-927f-000000000001';
  if found then raise exception 'Cross-user update allowed'; end if;
  delete from public.health_records where user_id = 'e136f6d3-d18d-4321-927f-000000000001';
  if found then raise exception 'Cross-user delete allowed'; end if;
  begin
    insert into public.health_records(user_id, data) values ('e136f6d3-d18d-4321-927f-000000000001', '{"version":1,"entries":[],"water":[]}');
    raise exception 'Cross-user insert allowed';
  exception when insufficient_privilege then null;
  end;
end $$;
select set_config('request.jwt.claim.sub', 'e136f6d3-d18d-4321-927f-000000000001', true);
update public.health_records set data = '{"version":1,"entries":[],"water":[]}' where revision = 1;
do $$ begin
  if (select revision from public.health_records) <> 2 then raise exception 'Revision did not increment'; end if;
end $$;
set local role anon;
do $$ begin
  begin
    perform * from public.health_records;
    raise exception 'Anonymous read allowed';
  exception when insufficient_privilege then null;
  end;
end $$;
rollback;
