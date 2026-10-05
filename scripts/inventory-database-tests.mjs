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
await db.exec(await readFile(new URL('../supabase/migrations/20261005161616_inventory_ledger.sql',import.meta.url),'utf8'));

const auth=async(id='11')=>db.exec(`reset role;select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000${id}',false);set role authenticated;`);
const write=async(action,data)=>(await db.query('select public.inventory_write($1,$2::jsonb) as receipt',[action,JSON.stringify(data)])).rows[0].receipt;
const workspace=async()=>(await db.query('select public.inventory_workspace() as data')).rows[0].data;
await auth();await assert.rejects(workspace());await assert.rejects(write('item',{item_code:'SOAP',name:'Soap',unit:'pieces',unit_cost:100,reorder_level:5}));
await db.exec(`reset role;insert into private.enterprise_assignments(profile_id,module,action,decision_reference) values
 ('00000000-0000-0000-0000-000000000001','inventory','read','synthetic-test'),
 ('00000000-0000-0000-0000-000000000001','inventory','create','synthetic-test');`);
await auth();const item=await write('item',{item_code:'SOAP',name:'Soap',unit:'pieces',unit_cost:100,reorder_level:5});assert.ok(item.receipt_id);
const movement={item_code:'SOAP',movement_key:'test-IN',movement_date:'2026-10-05',direction:'IN',quantity:'10',issued_to:'',received_from:'Synthetic supplier',purpose:'Opening stock',received_by:'Synthetic receiver',receipt_signature:'signed-voucher-1'};
const first=await write('movement',movement);assert.equal(first.status,'pending_approval');assert.equal((await workspace()).items[0].balance,0);
assert.equal((await write('movement',movement)).duplicate,true);
await assert.rejects(write('movement',{...movement,quantity:11}));await assert.rejects(write('movement',{...movement,movement_key:'zero',quantity:0}));
await assert.rejects(write('movement',{...movement,movement_key:'precision',quantity:'0.0001'}));
await assert.rejects(write('movement',{...movement,movement_key:'future',movement_date:'2099-01-01'}));
await assert.rejects(write('movement',{...movement,movement_key:'forged',submitted_by:'00000000-0000-0000-0000-000000000002'}));
await assert.rejects(write('movement',{...movement,movement_key:'missing-out',direction:'OUT',issued_to:''}));
await assert.rejects(db.exec("update inventory_items set unit_cost=1"));await assert.rejects(db.exec("insert into inventory_movements(item_id,movement_key) values(gen_random_uuid(),'forged')"));
const out=await write('movement',{...movement,movement_key:'test-OUT',direction:'OUT',quantity:3,issued_to:'Synthetic department'});
await auth('12');await assert.rejects(workspace());assert.equal((await db.query('select * from inventory_items')).rows.length,0);
await db.exec(`reset role;insert into private.enterprise_assignments(profile_id,module,action,record_id,decision_reference) values
 ('00000000-0000-0000-0000-000000000002','inventory','read','${item.receipt_id}','synthetic-test'),
 ('00000000-0000-0000-0000-000000000002','inventory','approve','${item.receipt_id}','synthetic-test');`);
await auth('12');await assert.rejects(write('post',{item_code:'SOAP',movement_id:first.receipt_id,approval_signature:'signed-approval-1'}));
await db.exec(`reset role;insert into private.enterprise_assignments(profile_id,module,action,record_id,decision_reference) values
 ('00000000-0000-0000-0000-000000000002','inventory','execute','${item.receipt_id}','synthetic-test');`);
await auth('12');const posted=await write('post',{item_code:'SOAP',movement_id:first.receipt_id,approval_signature:'signed-approval-1'});assert.equal(posted.balance_after,10);
assert.equal((await write('post',{item_code:'SOAP',movement_id:first.receipt_id,approval_signature:'signed-approval-1'})).duplicate,true);
await assert.rejects(write('post',{item_code:'SOAP',movement_id:out.receipt_id,approval_signature:''}));
await write('post',{item_code:'SOAP',movement_id:out.receipt_id,approval_signature:'signed-approval-2'});
let state=await workspace();assert.equal(state.items[0].balance,7);assert.equal(state.total_value,700);assert.equal(state.last_five[0].movement_key,'test-OUT');
await auth();const count=await write('count',{item_code:'SOAP',count_key:'friday-1',counted_quantity:6,reason:'Off-Friday test count'});assert.equal(count.variance,-1);
assert.equal((await write('count',{item_code:'SOAP',count_key:'friday-1',counted_quantity:6,reason:'Off-Friday test count'})).duplicate,true);
await assert.rejects(write('count',{item_code:'SOAP',count_key:'friday-1',counted_quantity:5,reason:'changed'}));
const tooMuch=await write('movement',{...movement,movement_key:'too-much',direction:'OUT',quantity:8,issued_to:'Synthetic department'});
await auth('12');await assert.rejects(write('post',{item_code:'SOAP',movement_id:tooMuch.receipt_id,approval_signature:'signed-approval-3'}));assert.equal((await workspace()).items[0].balance,7);
await auth();const imports=[{...movement,movement_key:'bulk-1'},{...movement,movement_key:'bulk-2',item_code:'UNKNOWN'}];
await assert.rejects(db.query('select public.inventory_import($1::jsonb)',[JSON.stringify(imports)]));assert.equal((await workspace()).movements.some(m=>m.movement_key==='bulk-1'),false);
const good=[{...movement,movement_key:'bulk-1'},{...movement,movement_key:'bulk-2'}];
assert.equal((await db.query('select public.inventory_import($1::jsonb) as receipt',[JSON.stringify(good)])).rows[0].receipt.receipts.length,2);
assert.equal((await db.query('select public.inventory_import($1::jsonb) as receipt',[JSON.stringify(good)])).rows[0].receipt.receipts.every(r=>r.duplicate),true);
// Dashboard totals cover all visible items and the actual last five posted receipts.
for(const [key,qty] of [['to-low',2],['to-zero',5]]){
 await auth();const receipt=await write('movement',{...movement,movement_key:key,direction:'OUT',quantity:qty,issued_to:'Synthetic department'});
 await auth('12');await write('post',{item_code:'SOAP',movement_id:receipt.receipt_id,approval_signature:'signed-'+key});
 const current=await workspace();assert.equal(current.low_stock,key==='to-low'?1:0);assert.equal(current.out_of_stock,key==='to-zero'?1:0);
}
for(let n=0;n<6;n++){
 await auth();const receipt=await write('movement',{...movement,movement_key:'recent-'+n,quantity:1});
 await auth('12');await write('post',{item_code:'SOAP',movement_id:receipt.receipt_id,approval_signature:'signed-recent-'+n});
}
state=await workspace();assert.equal(state.last_five.length,5);assert.equal(state.last_five[0].movement_key,'recent-5');assert.equal(state.items[0].balance,6);assert.equal(state.counts[0].system_quantity,7);
// Even holding all grants, the person submitting a movement cannot post it.
await db.exec(`reset role;insert into private.enterprise_assignments(profile_id,module,action,decision_reference) values
 ('00000000-0000-0000-0000-000000000001','inventory','approve','synthetic-test'),
 ('00000000-0000-0000-0000-000000000001','inventory','execute','synthetic-test');`);
await auth();await assert.rejects(write('post',{item_code:'SOAP',movement_id:tooMuch.receipt_id,approval_signature:'self-approval'}));
await db.exec("reset role;update private.enterprise_assignments set revoked_at=now() where profile_id='00000000-0000-0000-0000-000000000002'");
await auth('12');await assert.rejects(workspace());
await db.exec("reset role;update profiles set is_active=false where id='00000000-0000-0000-0000-000000000001'");await auth();await assert.rejects(workspace());
await auth('13');await assert.rejects(workspace());await db.exec('reset role;set role anon');await assert.rejects(workspace());
await db.exec('reset role;set role service_role');await assert.rejects(workspace());await assert.rejects(db.exec('delete from inventory_movements'));
await db.close();console.log('PASS inventory real PostgreSQL: assigned reads, independent approval+execution, signed voucher references, posted-only balance/value/latest-five, immutable quantities, duplicate and conflicting replay, atomic upload rollback, count snapshots, insufficient stock, revoked/inactive/client/anonymous/service-role denial.');
