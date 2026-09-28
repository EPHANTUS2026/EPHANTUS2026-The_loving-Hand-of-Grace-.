import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const lifetime = 30 * 60 * 1000;
function key(secret) {
  if (!secret || secret.length < 32) throw new Error('conversation_unconfigured');
  return createHash('sha256').update('lhg-grace-conversation-v1:' + secret).digest();
}
export function sealConversation(turns, owner, secret, now = Date.now()) {
  const bounded = turns.slice(-8).map(turn => ({
    user: String(turn.user).slice(0,2000), assistant: String(turn.assistant).slice(0,2500),
  }));
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm',key(secret),iv);
  cipher.setAAD(Buffer.from(owner));
  const data = Buffer.concat([cipher.update(JSON.stringify({expires:now+lifetime,turns:bounded})),cipher.final()]);
  return Buffer.concat([iv,cipher.getAuthTag(),data]).toString('base64url');
}
export function openConversation(token, owner, secret, now = Date.now()) {
  if (!token) return [];
  if (typeof token !== 'string' || token.length > 65000) throw new Error('invalid_conversation');
  try {
    const bytes = Buffer.from(token,'base64url');
    const decipher = createDecipheriv('aes-256-gcm',key(secret),bytes.subarray(0,12));
    decipher.setAAD(Buffer.from(owner)); decipher.setAuthTag(bytes.subarray(12,28));
    const state = JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)),decipher.final()]).toString());
    if (state.expires <= now || !Array.isArray(state.turns)) throw new Error('expired');
    return state.turns;
  } catch { throw new Error('invalid_conversation'); }
}
