export const PUBLIC_ACCOUNT_ROLES=['member','client','family'];
export function publicRoleAllowed(profile){return Boolean(profile?.is_active&&PUBLIC_ACCOUNT_ROLES.includes(profile.role));}
export function emailValue(value){const s=String(value||'').trim().toLowerCase();if(s.length>254||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))throw new Error('Enter a valid email address.');return s;}
export function passwordValue(value){if(typeof value!=='string'||value.length<12||value.length>128)throw new Error('Use a password between 12 and 128 characters.');return value;}
export function phoneValue(value){const s=String(value||'').replace(/[\s()-]/g,'');if(! /^\+[1-9][0-9]{7,14}$/.test(s))throw new Error('Use an international phone number, such as +254712345678.');return s;}
