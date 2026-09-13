import fs from 'node:fs';import path from 'node:path';
const root=process.cwd();let failures=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(['node_modules','.next','.git'].includes(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(/\.(js|mjs)$/.test(e.name))check(p)}}
function check(file){const s=fs.readFileSync(file,'utf8');for(const m of s.matchAll(/from\s+['"]@\/([^'"]+)['"]/g)){const rel=m[1];const candidates=[path.join(root,rel),path.join(root,rel+'.js'),path.join(root,rel,'index.js')];if(!candidates.some(fs.existsSync))failures.push(`${path.relative(root,file)} -> @/${rel}`)}}
walk(root);if(failures.length){console.error('Unresolved imports:\n'+failures.join('\n'));process.exit(1)}console.log('Import resolution check passed.');
