import { cookies } from 'next/headers';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function configured(){ return Boolean(url && anon); }

async function request(path, { method='GET', token, body, admin=false, headers={} }={}){
  if(!configured()) throw new Error('Database is not configured. Add Supabase environment variables.');
  const key = admin ? service : anon;
  if(admin && !service) throw new Error('Server service role key is not configured.');
  const res = await fetch(`${url}${path}`, {
    method,
    cache:'no-store',
    headers:{
      apikey:key,
      Authorization:`Bearer ${admin ? service : (token || anon)}`,
      'Content-Type':'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if(!res.ok) throw new Error(data?.msg || data?.message || data?.error_description || `Database request failed (${res.status})`);
  return data;
}

export async function signIn(email,password){
  return request('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password}});
}

export async function getAuthUser(token){
  return request('/auth/v1/user',{token});
}

export async function getSession(){
  if(!configured()) return null;
  const token = cookies().get('lhg_access')?.value;
  if(!token) return null;
  try {
    const user = await getAuthUser(token);
    const profiles = await request(`/rest/v1/profiles?auth_user_id=eq.${encodeURIComponent(user.id)}&select=id,auth_user_id,full_name,role,is_active,client_id,family_member_id,staff_id`,{token});
    return { token, user, profile: profiles?.[0] || null };
  } catch { return null; }
}

export async function dbSelect(table, query='', token){
  return request(`/rest/v1/${table}?${query}`,{token});
}
export async function dbAdminSelect(table, query=''){
  return request(`/rest/v1/${table}?${query}`,{admin:true});
}

export async function dbInsert(table, body, {admin=true, token}={}){
  return request(`/rest/v1/${table}`,{method:'POST',body,admin,token,headers:{Prefer:'return=representation'}});
}

export async function dbUpdate(table, query, body, {admin=true, token}={}){
  return request(`/rest/v1/${table}?${query}`,{method:'PATCH',body,admin,token,headers:{Prefer:'return=representation'}});
}
