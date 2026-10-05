
import assert from 'node:assert/strict';
import {movementColumns,parseMovementCSV,validateInventory} from '../lib/inventory-validation.mjs';
const m={movement_key:'R-1',item_code:'SOAP',movement_date:'2026-10-05',direction:'OUT',quantity:'2.5',issued_to:'Kitchen',received_from:'',purpose:'Daily use',received_by:'Receiver',receipt_signature:'signed-voucher-1'};
assert.ok(validateInventory('movement',m));for(const patch of [{quantity:'-1'},{quantity:'0'},{quantity:'1.0001'},{quantity:'Infinity'},{issued_to:''},{receipt_signature:''},{movement_date:'2026-02-30'},{approved_by:'forged'}])assert.equal(validateInventory('movement',{...m,...patch}),false);
const header=movementColumns.join(',')+'\n';const row=movementColumns.map(k=>m[k]).join(',');assert.equal(parseMovementCSV(header+row).length,1);assert.throws(()=>parseMovementCSV(header+row+'\n'+row));assert.throws(()=>parseMovementCSV(header+'bad'));assert.throws(()=>parseMovementCSV('item_id,qty\nSOAP,1'));
const quoted=movementColumns.map(k=>k==='purpose'?'"Use, daily"':m[k]).join(',');assert.equal(parseMovementCSV(header+quoted)[0].purpose,'Use, daily');
console.log('PASS inventory validation and CSV: required issue/receipt evidence, precision, dates, forged fields, duplicate references, quoted CSV and header mapping.');
