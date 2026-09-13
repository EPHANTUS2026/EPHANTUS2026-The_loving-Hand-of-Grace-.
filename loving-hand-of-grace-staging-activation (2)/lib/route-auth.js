import { getSession } from './supabase-rest';
export async function authorised(roles){const s=await getSession();return s?.profile&&s.profile.is_active&&roles.includes(s.profile.role)?s:null}
export function field(fd,key,max=4000){return String(fd.get(key)||'').trim().slice(0,max)}
export function nullable(value){return value?value:null}
export function toNairobiISO(value){if(!value)return null;const v=String(value);if(/[zZ]|[+-]\d\d:\d\d$/.test(v))return new Date(v).toISOString();return new Date(`${v}:00+03:00`).toISOString()}
