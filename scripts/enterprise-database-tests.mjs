import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {PGlite}=await import(process.env.PGLITE_MODULE_PATH||'@electric-sql/pglite');
const db=new PGlite();
await db.exec(`
 create role anon;create role authenticated;create role service_role;
 create schema auth;
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to authenticated,anon;
 create table public.staff(id uuid primary key);
 create table public.profiles(id uuid primary key,auth_user_id uuid,staff_id uuid,role text,is_active boolean);
 create table public.enterprise_records(id uuid primary key default gen_random_uuid(),module text,record_type text not null,reference text unique,title text,priority text,status text default 'new',owner_staff_id uuid,requester_staff_id uuid,amount numeric(14,2),currency text,due_at timestamptz,data jsonb);
 create table public.workflow_instances(id uuid primary key default gen_random_uuid(),workflow_key text,entity_type text,entity_id uuid,current_state text,status text,metadata jsonb);
 create table public.workflow_tasks(id uuid primary key default gen_random_uuid(),workflow_instance_id uuid,task_type text,title text,assigned_staff_id uuid,status text,due_at timestamptz,payload jsonb);
 create table public.workflow_events(id uuid primary key default gen_random_uuid(),workflow_instance_id uuid,event_type text,source_channel text,actor_type text,actor_id uuid,summary text,metadata jsonb);
 create table public.workflow_approvals(id uuid primary key default gen_random_uuid(),workflow_instance_id uuid,status text);
 create table public.enterprise_comments(id uuid primary key default gen_random_uuid(),record_id uuid,body text);
 create table public.audit_log(id uuid primary key default gen_random_uuid(),action text,entity_type text,entity_id uuid,actor_profile_id uuid,after_state jsonb,reason text);
 do $$declare t text;begin foreach t in array array['enterprise_records','workflow_instances','workflow_tasks','workflow_events','workflow_approvals','enterprise_comments'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('create policy legacy_staff on public.%I for all to authenticated using (true) with check (true)',t);
 end loop;end $$;
 grant select,insert,update,delete on all tables in schema public to authenticated,anon;
 insert into profiles values
 ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000101','procurement',true),
 ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000102','finance',true),
 ('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000013',null,'client',true);
`);
const migration=await readFile(new URL('../supabase/migrations/20261005140223_enterprise_module_authority.sql',import.meta.url),'utf8');
await db.exec(migration);
const auth=async(id='11')=>db.exec(`reset role;select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000${id}',false);set role authenticated;`);
const allowed=async(module,action,id=null)=>(await db.query('select public.enterprise_authority($1,$2,$3) as allowed',[module,action,id])).rows[0].allowed;
await auth();assert.equal(await allowed('purchase','create'),false);
await db.exec(`reset role;insert into private.enterprise_assignments(profile_id,module,action,decision_reference) values
 ('00000000-0000-0000-0000-000000000001','purchase','create','synthetic-test'),
 ('00000000-0000-0000-0000-000000000001','purchase','read','synthetic-test'),
 ('00000000-0000-0000-0000-000000000001','purchase','edit','synthetic-test');`);
await auth();assert.equal(await allowed('purchase','create'),true);assert.equal(await allowed('hr','create'),false);
const result=(await db.query("select public.create_enterprise_record('purchase','purchase_request','Synthetic request') as receipt")).rows[0].receipt;
assert.ok(result.record.id&&result.workflow_id);const id=result.record.id,wid=result.workflow_id;
assert.equal((await db.query('select * from enterprise_records')).rows.length,1);
await assert.rejects(db.exec("insert into enterprise_records(module,record_type,title) values('purchase','purchase_request','Direct bypass')"));
assert.equal((await db.query("update enterprise_records set title='Direct bypass' where id=$1 returning id",[id])).rows.length,0);
await assert.rejects(db.exec("insert into private.enterprise_assignments(profile_id,module,action,decision_reference) values('00000000-0000-0000-0000-000000000001','hr','read','forged')"));
await auth('12');assert.equal((await db.query('select * from enterprise_records')).rows.length,0);assert.equal((await db.query('select * from workflow_instances')).rows.length,0);
assert.equal((await db.query('select * from workflow_tasks')).rows.length,0);
await db.exec(`reset role;insert into private.enterprise_assignments(profile_id,module,action,record_id,decision_reference) values('00000000-0000-0000-0000-000000000002','purchase','read','${id}','synthetic-assigned-record');`);
await auth('12');assert.equal((await db.query('select * from enterprise_records')).rows.length,1);
await db.exec("reset role;update private.enterprise_assignments set revoked_at=now() where profile_id='00000000-0000-0000-0000-000000000002'");
await auth('12');assert.equal((await db.query('select * from enterprise_records')).rows.length,0);
await db.exec("reset role;update profiles set is_active=false where id='00000000-0000-0000-0000-000000000001'");
await auth();assert.equal(await allowed('purchase','create'),false);assert.equal((await db.query('select * from enterprise_records')).rows.length,0);
await db.exec("reset role;update profiles set is_active=true where id='00000000-0000-0000-0000-000000000001';update private.enterprise_assignments set ends_at=now() where profile_id='00000000-0000-0000-0000-000000000001'");
await auth();assert.equal(await allowed('purchase','create'),false);
await db.exec("reset role;update private.enterprise_assignments set ends_at=null,starts_at=now()+interval '1 day' where profile_id='00000000-0000-0000-0000-000000000001'");
await auth();assert.equal(await allowed('purchase','create'),false);
await db.exec("reset role;update private.enterprise_assignments set starts_at=now()-interval '1 day' where profile_id='00000000-0000-0000-0000-000000000001'");
await auth();assert.equal(await allowed('purchase','approve',id),false);assert.equal(await allowed('purchase','execute',id),false);assert.equal(await allowed('purchase','export',id),false);
await assert.rejects(db.query("update workflow_instances set status='completed' where id=$1",[wid]).then(r=>{if(!r.rows.length)throw Error('Denied');}));
await db.exec(`reset role;select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000011',false)`);
await assert.rejects(db.query("update workflow_instances set status='completed' where id=$1",[wid]));
// A late task-insert failure must roll back the record, flow, events and audit.
await db.exec("create function private.synthetic_fail_task() returns trigger language plpgsql as $$begin raise exception 'synthetic late failure';end;$$;create trigger synthetic_failure before insert on workflow_tasks for each row execute function private.synthetic_fail_task();");
await auth();await assert.rejects(db.query("select public.create_enterprise_record('purchase','purchase_request','Synthetic rollback')"));
assert.equal((await db.query('select * from enterprise_records')).rows.length,1);
await auth('13');assert.equal(await allowed('purchase','read',id),false);
await db.exec('reset role;set role anon');assert.equal((await db.query('select * from enterprise_records')).rows.length,0);
await assert.rejects(db.query("select public.create_enterprise_record('purchase','purchase_request','Anonymous')"));
await db.close();
console.log('PASS isolated PostgreSQL migration, RLS owned/assigned reads, unassigned/client/anonymous/inactive/revoked/expired/future denial, direct-write/grant forgery denial, execution guard and late-failure atomic rollback. Synthetic schema; live Supabase certification remains pending.');
