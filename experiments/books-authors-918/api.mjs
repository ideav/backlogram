export const BASE = process.env.BK_BASE || 'http://127.0.0.1:18918/bk';
export const TOKEN = 'bk918tok';
let XSRF;
export async function get(p, ms = 600000) {
  const r = await fetch(BASE + p, { headers: { 'X-Authorization': TOKEN }, signal: AbortSignal.timeout(ms) });
  const t = await r.text();
  if (r.status !== 200) throw new Error(`GET ${p} ${r.status} ${t.slice(0, 300)}`);
  return JSON.parse(t);
}
export async function post(p, f = {}) {
  if (!XSRF) XSRF = (await get('/xsrf?JSON=1'))._xsrf;
  const r = await fetch(BASE + p, { method: 'POST', headers: { 'X-Authorization': TOKEN, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ _xsrf: XSRF, ...f }).toString() });
  const t = await r.text();
  if (r.status !== 200) throw new Error(`POST ${p} ${r.status} ${t.slice(0, 300)}`);
  return JSON.parse(t);
}
