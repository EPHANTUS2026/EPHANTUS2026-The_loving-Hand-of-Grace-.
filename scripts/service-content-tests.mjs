import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../lib/services.js',import.meta.url),'utf8');
const {serviceRecords,getService}=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
assert.equal(serviceRecords.length,6);
for(const record of serviceRecords){
 assert.equal(getService(record.slug),record);
 assert.equal(record.processSteps.length,5);
 assert.ok(record.sections.length>=5);
 assert.equal(record.ctaConfig.support,'/contact');
 for(const slug of record.relatedServices)assert.ok(getService(slug));
}
for(const slug of ['missing','constructor','toString','__proto__',''])assert.equal(getService(slug),null);
console.log('Service catalogue PASS: six records, five-step processes, valid related services, unknown/prototype slugs rejected');
