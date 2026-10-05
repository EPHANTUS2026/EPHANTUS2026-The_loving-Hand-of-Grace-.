import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {STAFF_ROLES} from '../lib/roles.js';

const source=await readFile(new URL('../lib/auth.js',import.meta.url),'utf8');
let session;
const auth=new Function('redirect','getSession',source.replace(/^import .*;\s*$/gm,'').replaceAll('export ','')+';return {requireSession,homeForRole};')(
 path=>{throw Object.assign(new Error('redirect'),{path});},async()=>session
);
const adminPage=await readFile(new URL('../app/admin/page.js',import.meta.url),'utf8');
const adminRoles=JSON.parse(adminPage.match(/requireSession\((\[[^\]]+\])\)/)[1].replaceAll("'",'"'));
session={profile:{role:'director',is_active:true}};
assert.equal(auth.homeForRole('director'),'/staff');
await assert.rejects(auth.requireSession(adminRoles),e=>e.path==='/staff');
assert.equal(await auth.requireSession(STAFF_ROLES),session);
for(const role of ['client','family','clinician']){
 session={profile:{role,is_active:true}};
 await assert.rejects(auth.requireSession(adminRoles),e=>e.path===auth.homeForRole(role)&&e.path!=='/admin');
}
for(const role of adminRoles){session={profile:{role,is_active:true}};assert.equal(await auth.requireSession(adminRoles),session);}
session={profile:{role:'director',is_active:false}};
await assert.rejects(auth.requireSession(STAFF_ROLES),e=>e.path==='/login');
session=null;await assert.rejects(auth.requireSession(STAFF_ROLES),e=>e.path==='/login');
console.log('PASS Director denial lands on an authorised staff route; management grants unchanged; client/family/clinical administration denial and inactive/anonymous login enforced. Session boundaries mocked; authenticated browser acceptance remains separate.');
