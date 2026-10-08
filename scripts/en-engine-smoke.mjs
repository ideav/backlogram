#!/usr/bin/env node
// End-to-end smoke test of the English Integram engine (site-en/engine) against a running stack.
//
//   node scripts/en-engine-smoke.mjs --compose          build dist-en, start site-en/docker-compose.yml,
//                                                       test, then `docker compose down -v`
//   node scripts/en-engine-smoke.mjs --base http://localhost:8080 --mailpit http://localhost:8025
//                                                       test an already running stack
//
// Flow: /start page -> sign up by email -> confirmation mail read from the Mailpit API -> confirm
// -> log in -> open the new workspace -> open the /my cabinet; plus bot-guard and OAuth checks.
import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const args = process.argv.slice(2)
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 && args[i + 1] ? args[i + 1] : def }
const BASE = opt('--base', process.env.SMOKE_BASE_URL || 'http://localhost:8080').replace(/\/$/, '')
const MAILPIT = opt('--mailpit', process.env.SMOKE_MAILPIT_URL || 'http://localhost:8025').replace(/\/$/, '')
const COMPOSE = args.includes('--compose')
const KEEP = args.includes('--keep')
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CYR = /[Ѐ-ӿ]/

let failed = 0
const results = []
function check(name, ok, info = '') {
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  (' + info + ')' : ''}`)
  console.log(results[results.length - 1])
  if (!ok) failed++
  return ok
}

// Minimal cookie jar
const jar = new Map()
function storeCookies(res) {
  for (const c of res.headers.getSetCookie ? res.headers.getSetCookie() : []) {
    const [pair, ...attrs] = c.split(';')
    const eq = pair.indexOf('=')
    const name = pair.slice(0, eq).trim(), value = pair.slice(eq + 1).trim()
    const expired = attrs.some(a => /expires=/i.test(a) && new Date(a.split('=')[1]) < new Date()) || value === '' || value === 'deleted'
    if (expired) jar.delete(name); else jar.set(name, value)
  }
}
const cookieHeader = () => [...jar].map(([k, v]) => `${k}=${v}`).join('; ')
async function req(url, { method = 'GET', form, redirect = 'manual' } = {}) {
  const headers = { cookie: cookieHeader() }
  let body
  if (form) { body = new URLSearchParams(form).toString(); headers['content-type'] = 'application/x-www-form-urlencoded' }
  const res = await fetch(url.startsWith('http') ? url : BASE + url, { method, headers, body, redirect })
  storeCookies(res)
  const text = await res.text()
  let json; try { json = JSON.parse(text) } catch { json = undefined }
  return { status: res.status, location: res.headers.get('location') || '', text, json }
}
const sleep = ms => new Promise(r => setTimeout(r, ms))

function sh(cmd) { console.log('$ ' + cmd); execSync(cmd, { cwd: ROOT, stdio: 'inherit' }) }

async function waitUp() {
  for (let i = 0; i < 90; i++) {
    try { const r = await fetch(BASE + '/start'); if (r.status === 200) return true } catch {}
    await sleep(2000)
  }
  return false
}

async function main() {
  if (COMPOSE) {
    if (!args.includes('--no-build')) sh('npm run build:en')
    sh('docker compose -f site-en/docker-compose.yml up -d --build')
  }
  try {
    check('stack is up (/start answers 200)', await waitUp(), BASE)

    // 1. Auth page
    const start = await req('/start')
    check('/start renders the English auth page', start.status === 200 && /Log in to Integram/.test(start.text) && /Create your free account/.test(start.text))
    check('/start has no Cyrillic', !CYR.test(start.text))
    check('/start links Terms and Privacy', start.text.includes('href="/terms"') && start.text.includes('href="/privacy"'))

    // 1b. Marketing pages from dist-en next to the engine
    const home = await req('/')
    check('/ serves the marketing home page', home.status === 200 && /<html[^>]*lang="en"/.test(home.text), 'HTTP ' + home.status)
    const pricing = await req('/pricing')
    check('/pricing is served without a redirect', pricing.status === 200 && /<html/.test(pricing.text), `${pricing.status} ${pricing.location}`)
    const slash = await req('/pricing/')
    check('/pricing/ -> 301 /pricing', slash.status === 301 && /\/pricing$/.test(slash.location), `${slash.status} ${slash.location}`)
    const offer = await req('/offer_en.html')
    check('/offer_en.html -> 301 /terms', offer.status === 301 && /\/terms$/.test(offer.location), `${offer.status} ${offer.location}`)

    // 2. Bot guard: honeypot
    const hp = await req('/my/register?JSON', { method: 'POST', form: { email: 'bot@example.com', regpwd: 'password123', regpwd1: 'password123', agree: '1', website: 'http://spam' } })
    check('honeypot rejects a filled "website" field', hp.status === 400, 'HTTP ' + hp.status)

    // 3. Sign up
    const email = `smoke${Date.now()}@example.com`
    const password = 'Smoke-pass-123'
    const reg = await req('/my/register?JSON', { method: 'POST', form: { email, regpwd: password, regpwd1: password, agree: '1' } })
    check('sign-up returns toConfirm', reg.json && reg.json.message === 'toConfirm', reg.text.slice(0, 160))
    const db = reg.json && reg.json.db
    const dup = await req('/my/register?JSON', { method: 'POST', form: { email, regpwd: password, regpwd1: password, agree: '1' } })
    check('second sign-up with the same email is refused', dup.status === 400 && /already registered/i.test(dup.text), dup.text.slice(0, 120))

    // 4. Confirmation mail
    let link = ''
    for (let i = 0; i < 20 && !link; i++) {
      const list = await (await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent('to:' + email)}`)).json()
      const m = (list.messages || [])[0]
      if (m) {
        const msg = await (await fetch(`${MAILPIT}/api/v1/message/${m.ID}`)).json()
        check('confirmation mail is English', !CYR.test(msg.Text + msg.Subject), msg.Subject)
        const found = /https?:\/\/\S+\/my\/register\?u=\d+&c=[a-f0-9]+/.exec(msg.Text)
        link = found ? found[0] : ''
      } else await sleep(1000)
    }
    check('confirmation mail arrived with a link', !!link, link)
    if (!link) throw new Error('no confirmation link')

    // 5. Confirm
    const confirmUrl = new URL(link)
    const conf = await req(confirmUrl.pathname + confirmUrl.search)
    check('confirmation redirects to the new workspace', conf.status === 302 && conf.location === '/' + db, `${conf.status} -> ${conf.location}`)
    const reuse = await req(confirmUrl.pathname + confirmUrl.search)
    check('confirmation link cannot be reused', reuse.status === 302 && /r=EXPIRED/.test(reuse.location), reuse.location)

    // 6. Log in (fresh cookie jar)
    jar.clear()
    const bad = await req('/my/auth?JSON', { method: 'POST', form: { login: email, pwd: 'wrong-password' } })
    check('wrong password is refused', bad.status === 401, 'HTTP ' + bad.status)
    const login = await req('/my/auth?JSON', { method: 'POST', form: { login: email, pwd: password } })
    check('log in to the cabinet returns a token', !!(login.json && login.json.token) && jar.has('idb_my'), login.text.slice(0, 100))
    const wsLogin = await req(`/${db}/auth?JSON`, { method: 'POST', form: { login: email, pwd: password } })
    check('log in to the workspace with the same email/password', !!(wsLogin.json && wsLogin.json.token) && jar.has('idb_' + db), wsLogin.text.slice(0, 100))

    // 7. Workspace and cabinet
    const ws = await req('/' + db)
    check(`workspace /${db} opens`, ws.status === 200 && /<html/i.test(ws.text) && !/r=InvalidToken|Invalid database/.test(ws.location + ws.text), 'HTTP ' + ws.status)
    check('workspace page has no Cyrillic', !CYR.test(ws.text), (ws.text.match(/.{0,40}[Ѐ-ӿ].{0,40}/) || [''])[0])
    const tables = await req(`/${db}/object/18?JSON`)
    check('workspace API answers (users table)', tables.status === 200 && tables.json !== undefined, 'HTTP ' + tables.status + ' ' + tables.text.slice(0, 120))
    const my = await req('/my')
    check('/my cabinet opens', my.status === 200 && /<html/i.test(my.text), 'HTTP ' + my.status)
    check('/my cabinet has no Cyrillic', !CYR.test(my.text), (my.text.match(/.{0,40}[Ѐ-ӿ].{0,40}/) || [''])[0])
    const dbs = await req('/my/report/313?JSON_KV')
    check('cabinet lists the new workspace', dbs.text.includes(`"${db}"`), dbs.text.slice(0, 160))

    // 8. Password reset mail
    const reset = await req('/my/auth?JSON', { method: 'POST', form: { login: email, reset: '1' } })
    check('password reset is accepted', reset.json && reset.json.message === 'MAIL', reset.text.slice(0, 120))

    // 9. OAuth without configured keys falls back to /start with a message
    const gh = await req('/auth/github')
    check('/auth/github without keys -> /start?r=oauthError', gh.status === 302 && /^\/start\?.*r=oauthError/.test(gh.location), gh.location)

    // 10. Unknown workspace -> auth page
    jar.clear()
    const nows = await req('/nosuchws123')
    check('unknown workspace redirects to /start', nows.status === 302 && nows.location.startsWith('/start'), nows.location)
    const priv = await req('/include/connection.php')
    check('engine internals are not served', priv.status === 403, 'HTTP ' + priv.status)
  } finally {
    if (COMPOSE && !KEEP) sh('docker compose -f site-en/docker-compose.yml down -v')
  }
  console.log(`\n${results.length - failed} passed, ${failed} failed`)
  process.exit(failed ? 1 : 0)
}

main().catch(e => { console.error('SMOKE ERROR:', e.message); process.exit(1) })
