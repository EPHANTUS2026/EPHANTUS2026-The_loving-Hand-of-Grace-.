import assert from 'node:assert/strict';
import {buildGraceIdentityContext,assertSelfClient,requireFamilyConsent,requireStaffRelationship} from '../lib/grace/authority.js';
import {authorizeGraceAction} from '../lib/grace/action-gateway.js';
import {safetyDisposition} from '../lib/grace/safety-protocol.js';

const anon=buildGraceIdentityContext(null,{requestedMode:'STAFF'});
assert.equal(anon.mode,'PUBLIC');
const client=buildGraceIdentityContext({profile:{id:'p1',is_active:true,role:'client',client_id:'c1'}});
assert.equal(client.mode,'CLIENT'); assert.equal(assertSelfClient(client,'c1'),true);
assert.throws(()=>assertSelfClient(client,'c2'));

const family=buildGraceIdentityContext({profile:{id:'p2',is_active:true,role:'family',family_member_id:'f1'}});
assert.equal(requireFamilyConsent({identity:family,relationship:{family_member_id:'f1',consent_active:true,consent_scope:['updates']},category:'updates'}),true);
assert.throws(()=>requireFamilyConsent({identity:family,relationship:{family_member_id:'f1',consent_active:false,consent_scope:['updates']},category:'updates'}));
assert.throws(()=>requireFamilyConsent({identity:family,relationship:{family_member_id:'f2',consent_active:true,consent_scope:['*']},category:'updates'}));

const staff=buildGraceIdentityContext({profile:{id:'p3',is_active:true,role:'counsellor',staff_id:'s1'}});
assert.equal(requireStaffRelationship({identity:staff,assignment:{staff_id:'s1',active:true,purposes:['care'],scopes:['journey']},purpose:'care',scope:'journey'}),true);
assert.throws(()=>requireStaffRelationship({identity:staff,assignment:{staff_id:'s2',active:true,purposes:['*'],scopes:['*']},purpose:'care',scope:'journey'}));

assert.throws(()=>authorizeGraceAction({identity:anon,action:'request_callback',consent:true,intent:'DIAGNOSIS_REQUEST',idempotencyKey:'12345678'}));
assert.throws(()=>authorizeGraceAction({identity:anon,action:'request_callback',consent:true,intent:'CALLBACK_INTENT',idempotencyKey:'short'}));
assert.ok(authorizeGraceAction({identity:anon,action:'request_callback',consent:true,intent:'CALLBACK_INTENT',idempotencyKey:'request-123'}).commandId);
const emergency=safetyDisposition({safetyLevel:'EMERGENCY',providerAvailable:false});
assert.equal(emergency.modelRequired,false); assert.equal(emergency.humanEscalation,true); assert.equal(emergency.fallback,true);
console.log('Grace authority/action/safety invariants: PASS');
