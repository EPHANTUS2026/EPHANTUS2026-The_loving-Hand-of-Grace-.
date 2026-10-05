const text=(v,max,optional=false)=>typeof v==='string' && v.length<=max && (optional||v.trim().length>0);
const number=(v,decimals,positive=false)=> /^\d+(\.\d+)?$/.test(String(v)) && Number.isFinite(Number(v)) && Number(v)<1e10 && (positive?Number(v)>0:Number(v)>=0) && (!String(v).includes('.')||String(v).split('.')[1].length<=decimals);
const code=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,40}$/.test(v);
export const movementColumns=['movement_key','item_code','movement_date','direction','quantity','issued_to','received_from','purpose','received_by','receipt_signature'];
export function validateInventory(action,data){
 const fields={item:['item_code','name','unit','unit_cost','reorder_level'],movement:movementColumns,post:['item_code','movement_id','approval_signature'],count:['item_code','count_key','counted_quantity','reason']}[action];
 if(!fields||!data||typeof data!=='object'||Array.isArray(data)||Object.keys(data).some(k=>!fields.includes(k))||!code(data.item_code))return false;
 if(action==='item')return text(data.name,160)&&text(data.unit,40)&&number(data.unit_cost,2)&&number(data.reorder_level,3);
 if(action==='post')return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.movement_id)&&text(data.approval_signature,200);
 if(action==='count')return text(data.count_key,80)&&number(data.counted_quantity,3)&&text(data.reason,500);
 const date=new Date(data.movement_date+'T00:00:00Z');
 return text(data.movement_key,80)&&/^\d{4}-\d{2}-\d{2}$/.test(data.movement_date)&&!Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===data.movement_date&&['IN','OUT'].includes(data.direction)&&number(data.quantity,3,true)&&text(data.issued_to??'',160,data.direction==='IN')&&text(data.received_from??'',160,data.direction==='OUT')&&text(data.purpose,500)&&text(data.received_by,160)&&text(data.receipt_signature,200);
}
export function parseMovementCSV(raw){
 if(typeof raw!=='string'||new TextEncoder().encode(raw).length>128000)throw Error('CSV must be under 128 KB.');
 const rows=[];let row=[],field='',quoted=false;
 for(let i=0;i<raw.length;i++){
  const c=raw[i];
  if(c==='"'){if(quoted&&raw[i+1]==='"'){field+='"';i++;}else if(quoted)quoted=false;else if(field==='')quoted=true;else throw Error('Invalid CSV quoting.');}
  else if(c===','&&!quoted){row.push(field);field='';}
  else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&raw[i+1]==='\n')i++;row.push(field);if(row.some(v=>v!==''))rows.push(row);row=[];field='';}
  else field+=c;
 }
 if(quoted)throw Error('Unclosed CSV quotation.');row.push(field);if(row.some(v=>v!==''))rows.push(row);
 const head=rows.shift()?.map(s=>s.replace(/^\uFEFF/,'').trim());
 if(!head||head.join(',')!==movementColumns.join(','))throw Error('Use the supplied CSV column order.');
 if(rows.length<1||rows.length>200)throw Error('Upload 1–200 movements at a time.');
 const data=rows.map((values,i)=>{if(values.length!==head.length)throw Error(`Row ${i+2}: incorrect column count.`);const record=Object.fromEntries(head.map((k,j)=>[k,values[j].trim()]));if(!validateInventory('movement',record))throw Error(`Row ${i+2}: check required fields, date and quantity.`);return record;});
 if(new Set(data.map(d=>d.movement_key)).size!==data.length)throw Error('Movement references must be unique within the upload.');return data;
}
