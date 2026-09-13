export function dateTime(value){
  if(!value) return '—';
  try{return new Intl.DateTimeFormat('en-KE',{dateStyle:'medium',timeStyle:'short',timeZone:'Africa/Nairobi'}).format(new Date(value));}catch{return String(value)}
}
export function dateOnly(value){
  if(!value) return '—';
  try{return new Intl.DateTimeFormat('en-KE',{dateStyle:'medium',timeZone:'Africa/Nairobi'}).format(new Date(`${value}T12:00:00+03:00`));}catch{return String(value)}
}
export function inputDateTime(value){if(!value)return '';try{return new Date(new Date(value).getTime()+3*3600000).toISOString().slice(0,16)}catch{return ''}}
export function stageLabel(value=''){return String(value).split('_').map(x=>x.charAt(0).toUpperCase()+x.slice(1)).join(' ')}
export function initials(name=''){return String(name).split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]?.toUpperCase()).join('')||'—'}
