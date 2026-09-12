const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function requireEnv(names) {
  const missing = names.filter((n) => !process.env[n]);
  if (missing.length) throw new Error(`Missing environment variables: ${missing.join(', ')}`);
}

export function supabaseConfig() {
  requireEnv(['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
  return { baseUrl, serviceKey, anonKey };
}

export async function adminFetch(path, options = {}) {
  const { baseUrl, serviceKey } = supabaseConfig();
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) throw new Error(`${options.method || 'GET'} ${path} failed (${res.status}): ${typeof data === 'string' ? data : JSON.stringify(data)}`);
  return data;
}

export async function restSelect(table, query = '') {
  return adminFetch(`/rest/v1/${table}?${query}`, { method: 'GET' });
}

export async function restInsert(table, body) {
  return adminFetch(`/rest/v1/${table}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { Prefer: 'return=representation' },
  });
}

export async function restUpdate(table, query, body) {
  return adminFetch(`/rest/v1/${table}?${query}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { Prefer: 'return=representation' },
  });
}

export async function createAuthUser({ email, password, fullName }) {
  return adminFetch('/auth/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { full_name: fullName, staging: true } }),
  });
}

export async function deleteAuthUser(id) {
  return adminFetch(`/auth/v1/admin/users/${id}`, { method: 'DELETE' });
}

export async function authToken(email, password) {
  requireEnv(['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, '');
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Authentication failed for ${email}: ${JSON.stringify(data)}`);
  return data.access_token;
}

export async function appFetch(path, { token, method = 'GET', json, form, headers = {}, redirect = 'manual' } = {}) {
  requireEnv(['STAGING_BASE_URL']);
  const base = process.env.STAGING_BASE_URL.replace(/\/$/, '');
  const options = { method, redirect, headers: { ...headers } };
  if (token) options.headers.Cookie = `lhg_access=${token}`;
  if (json !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(json);
  }
  if (form) options.body = form instanceof URLSearchParams ? form : new URLSearchParams(form);
  const res = await fetch(`${base}${path}`, options);
  const text = await res.text();
  let body = text;
  try { body = text ? JSON.parse(text) : null; } catch {}
  return { res, body, text };
}

export function expectStatus(result, allowed, label) {
  const ok = Array.isArray(allowed) ? allowed.includes(result.res.status) : result.res.status === allowed;
  if (!ok) throw new Error(`${label} failed (${result.res.status}): ${result.text.slice(0, 700)}`);
}

export function syntheticId(prefix = 'STG') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}
