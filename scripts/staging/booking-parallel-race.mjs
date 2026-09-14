import { adminFetch, restSelect, restUpdate, syntheticId } from './lib.mjs';

const types=await restSelect('booking_types','slug=eq.initial-assessment&active=eq.true&select=id');
if(!types?.[0]) throw new Error('Initial assessment booking type missing');
const typeId=types[0].id;
const from=new Date(Date.now()+24*3600e3).toISOString().slice(0,10);
const to=new Date(Date.now()+14*24*3600e3).toISOString().slice(0,10);
const slots=await adminFetch('/rest/v1/rpc/get_available_booking_slots',{method:'POST',body:JSON.stringify({p_booking_type:typeId,p_from:from,p_to:to})});
if(!slots?.[0]) throw new Error('No synthetic booking slot available for race test');
const slot=slots[0];
const tokenA=syntheticId('RACE-A');
const tokenB=syntheticId('RACE-B');
const payload=(token)=>({p_booking_type:typeId,p_staff:slot.staff_id,p_start:slot.start_at,p_end:slot.end_at,p_format:'phone',p_booked_for:'self',p_hold_token_hash:token});
async function race(token){try{return {ok:true,value:await adminFetch('/rest/v1/rpc/hold_booking_slot',{method:'POST',body:JSON.stringify(payload(token))})};}catch(error){return {ok:false,error:String(error.message)}}}
const [a,b]=await Promise.all([race(tokenA),race(tokenB)]);
const wins=[a,b].filter(x=>x.ok),losses=[a,b].filter(x=>!x.ok);
if(wins.length!==1||losses.length!==1) throw new Error(`Parallel race FAILED: expected exactly one winner, got winners=${wins.length}, losers=${losses.length}`);
if(!/slot_unavailable|duplicate|conflict/i.test(losses[0].error)) throw new Error(`Parallel race loser failed for unexpected reason: ${losses[0].error}`);
await restUpdate('booking_slot_holds',`hold_token_hash=in.(${encodeURIComponent(tokenA)},${encodeURIComponent(tokenB)})`,{expires_at:new Date().toISOString()});
console.log('Booking parallel race PASS: exactly one concurrent hold acquired the slot; competing request was rejected.');