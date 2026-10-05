import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const db=new PGlite();
const id=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
await db.exec(`create role anon;create role authenticated;create schema auth;
create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create type user_role as enum('admissions','counsellor','clinician','clinical_director','doctor','psychologist','administrator','super_admin','client','family');
create type admission_stage as enum('enquiry','screening','assessment','admission_ready','admitted','treatment','discharge','aftercare','closed');
create table profiles(id uuid primary key,auth_user_id uuid,staff_id uuid,role user_role,is_active boolean);
create table admissions(id uuid primary key,reference text,client_id uuid,stage admission_stage,screening_summary text,assessment_summary text,updated_at timestamptz);
create table clients(id uuid primary key,admission_stage admission_stage,admission_date date,discharge_date date,updated_at timestamptz);
create table care_plans(client_id uuid,status text);create table discharge_plans(client_id uuid,status text,approved_by uuid,approved_at timestamptz);create table aftercare_plans(client_id uuid,status text);
create table workflow_instances(id uuid primary key default gen_random_uuid(),workflow_key text,entity_type text,entity_id uuid,current_state text,status text,metadata jsonb,updated_at timestamptz);
create table workflow_tasks(workflow_instance_id uuid,task_type text,title text,assigned_role user_role,status text,payload jsonb,completed_at timestamptz);
create table audit_log(actor_auth_user_id uuid,actor_profile_id uuid,action text,entity_type text,entity_id text,before_state jsonb,after_state jsonb,reason text);
create table staff_client_assignments(staff_id uuid,client_id uuid,active boolean,revoked_at timestamptz,starts_at timestamptz,ends_at timestamptz,scopes text[],purposes text[]);
create function grace_staff_authority(p_client_id uuid,p_scope text,p_purpose text) returns boolean language sql stable security definer set search_path='' as $$
select auth.uid() is not null and exists(select 1 from public.profiles p join public.staff_client_assignments a on a.staff_id=p.staff_id
where p.auth_user_id=auth.uid() and p.is_active and p.role::text not in ('client','family') and a.client_id=p_client_id and a.active and a.revoked_at is null
and a.starts_at<=now() and (a.ends_at is null or a.ends_at>now()) and (p_scope=any(a.scopes) or '*'=any(a.scopes)) and (p_purpose=any(a.purposes) or '*'=any(a.purposes)));$$;
insert into profiles values('${id(1)}','${id(11)}','${id(21)}','clinician',true),('${id(2)}','${id(12)}','${id(22)}','clinician',true),('${id(3)}','${id(13)}','${id(23)}','administrator',true),('${id(4)}','${id(14)}',null,'client',true);
insert into clients(id) values('${id(31)}');insert into admissions(id,reference,client_id,stage) values('${id(41)}','synthetic','${id(31)}','enquiry'),('${id(42)}','unlinked',null,'enquiry');
insert into staff_client_assignments values('${id(21)}','${id(31)}',true,null,'2020-01-01',null,array['journey'],array['care']);`);
await db.exec(await readFile(new URL('../supabase/migrations/017_atomic_recovery_journey_transition.sql',import.meta.url),'utf8'));
const auth=async n=>db.query(`select set_config('request.jwt.claim.sub',$1,false)`,[n?id(n):'']);
const call=async admission=>db.query(`select public.transition_recovery_journey($1,'screening','enquiry','synthetic')`,[id(admission)]);
// Positive proof of the old gap, isolated and rolled back.
await auth(12);await db.exec('begin');await call(41);await db.exec('rollback');
const repair=await readFile(new URL('../supabase/migrations/20261005181430_recovery_transition_relationship_guard.sql',import.meta.url),'utf8');
await db.exec(repair);await db.exec(repair); // forward repair is idempotent
await assert.rejects(call(41),/client_relationship_required/);
await auth(13);await assert.rejects(call(41),/client_relationship_required/);
await auth(11);
for(const patch of ["active=false","active=true,revoked_at=now()","revoked_at=null,ends_at='2020-01-01'","ends_at=null,starts_at='2999-01-01'","starts_at='2020-01-01',scopes=array['other']","scopes=array['journey'],purposes=array['other']"]){
 await db.exec(`update staff_client_assignments set ${patch}`);await assert.rejects(call(41),/client_relationship_required/);
}
await db.exec("update staff_client_assignments set purposes=array['care']");
await db.exec(`update profiles set is_active=false where id='${id(1)}'`);await assert.rejects(call(41),/active_profile_required/);
await db.exec(`update profiles set is_active=true where id='${id(1)}'`);
await auth(14);await db.query(`select set_config('request.jwt.claims',$1,false)`,[JSON.stringify({role:'administrator',staff_id:id(21)})]);await assert.rejects(call(41),/client_relationship_required/);
await auth(null);await assert.rejects(call(41),/authentication_required/);
assert.equal((await db.query(`select stage from admissions where id='${id(41)}'`)).rows[0].stage,'enquiry');
assert.equal((await db.query('select count(*)::int n from audit_log')).rows[0].n,0);
await auth(11);await call(41);assert.equal((await db.query(`select stage from admissions where id='${id(41)}'`)).rows[0].stage,'screening');
assert.equal((await db.query('select count(*)::int n from audit_log')).rows[0].n,1);
await assert.rejects(call(41),/stale_transition/);
await auth(12);await call(42); // unchanged unlinked intake authority
await db.close();
console.log('PASS recovery transition relationship guard: old bypass reproduced; assigned allowed; unrelated/admin/unassigned, revoked/expired/future/wrong-scope/wrong-purpose/inactive/forged/client/anonymous denied; denial atomic; lifecycle/audit/unlinked intake preserved; repair rerun safe.');
