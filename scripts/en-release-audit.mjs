#!/usr/bin/env node
// Release gate for the English site (issue #536, epic #524).
// Audits a LIVE domain for "traces of the RF" and prints a Markdown report to
// stdout (suitable for an issue comment). Exit code 1 if any check FAILs.
//
//   node scripts/en-release-audit.mjs [https://ideav.pro] [--max-pages=300]
//
// All network I/O goes through `curl` (and a raw TLS socket), not Node's fetch,
// because on some dev machines DNS is faked by a proxifier: DNS is resolved via
// DNS-over-HTTPS (cloudflare-dns.com, pinned to 1.1.1.1) and pages are fetched
// with `curl --resolve host:443:<real ip>`.
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import tls from 'node:tls'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { scanText, isAllowed } from './lib/en-guard-rules.mjs'

const run = promisify(execFile)
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const origin = new URL(args.find((a) => !a.startsWith('--')) ?? 'https://ideav.pro').origin
const host = new URL(origin).hostname
const maxPages = Number((args.find((a) => a.startsWith('--max-pages=')) ?? '--max-pages=300').split('=')[1])
const allowlist = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests', 'en-guard-allowlist.json'), 'utf8'))

const rows = [] // {area, check, status, detail}
const add = (area, check, status, detail = '') => rows.push({ area, check, status, detail })
const esc = (s) => String(s).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ')

// ---------- curl helpers ----------
async function curl(argv, { text = true } = {}) {
  try {
    const { stdout } = await run('curl', ['-sS', '--max-time', '40', ...argv], {
      encoding: text ? 'utf8' : 'buffer',
      maxBuffer: 64 * 1024 * 1024,
    })
    return { ok: true, out: stdout }
  } catch (e) {
    return { ok: false, out: '', err: String(e.stderr || e.message).trim() }
  }
}

const DOH_PIN = ['--resolve', 'cloudflare-dns.com:443:1.1.1.1']
async function doh(name, type) {
  const r = await curl([...DOH_PIN, '-H', 'accept: application/dns-json', `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`])
  if (!r.ok) return { error: r.err, answers: [] }
  try {
    const j = JSON.parse(r.out)
    return { status: j.Status, answers: (j.Answer ?? []).filter((a) => a.type === typeNum(type)).map((a) => a.data) }
  } catch (e) {
    return { error: 'bad DoH response', answers: [] }
  }
}
const typeNum = (t) => ({ A: 1, NS: 2, CNAME: 5, MX: 15, TXT: 16, AAAA: 28 })[t]

async function geo(ip) {
  const r = await curl([`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,regionName,city,isp,org,as`])
  try {
    return JSON.parse(r.out)
  } catch {
    return { status: 'fail', message: r.err || 'no answer' }
  }
}
const isRuGeo = (g) => g?.countryCode === 'RU' || /\b(reg\.ru|regru|beget|timeweb|selectel|yandex|vk\b|mail\.ru|rostelecom|rt-dc)/i.test(`${g?.isp} ${g?.org} ${g?.as}`)
const geoLine = (g) => (g?.status === 'success' ? `${g.countryCode} ${g.city ?? ''} - ${g.isp ?? g.org ?? ''} (${g.as ?? ''})` : `lookup failed: ${g?.message}`)

function parseResponse(raw) {
  // curl -i output; may contain several header blocks (100-continue, proxy). Take the last block.
  let rest = raw
  let head = ''
  for (;;) {
    const m = rest.match(/^HTTP\/[\d.]+ \d+[^\r\n]*\r?\n([\s\S]*?)\r?\n\r?\n/)
    if (!m) break
    head = m[0]
    rest = rest.slice(m[0].length)
    if (!/^HTTP\/[\d.]+ 1\d\d/.test(head)) break
  }
  const status = Number((head.match(/^HTTP\/[\d.]+ (\d+)/) ?? [])[1] ?? 0)
  const headers = {}
  const setCookies = []
  for (const line of head.split(/\r?\n/).slice(1)) {
    const i = line.indexOf(':')
    if (i < 1) continue
    const k = line.slice(0, i).toLowerCase()
    const v = line.slice(i + 1).trim()
    if (k === 'set-cookie') setCookies.push(v)
    headers[k] = headers[k] ? `${headers[k]}, ${v}` : v
  }
  return { status, headers, setCookies, body: rest }
}

let originIps = []
async function get(url, extra = []) {
  const u = new URL(url)
  const pin = u.hostname === host && originIps.length ? ['--resolve', `${host}:${u.protocol === 'https:' ? 443 : 80}:${originIps[0]}`] : []
  const r = await curl([...pin, '-i', '-A', 'Mozilla/5.0 (en-release-audit)', ...extra, url])
  if (!r.ok) return { status: 0, error: r.err, headers: {}, setCookies: [], body: '' }
  return parseResponse(r.out)
}

function tlsInfo(ip, servername) {
  return new Promise((resolve) => {
    const s = tls.connect({ host: ip, port: 443, servername, rejectUnauthorized: false, timeout: 15000 }, () => {
      const c = s.getPeerCertificate()
      const res = { issuer: [c.issuer?.O, c.issuer?.CN].filter(Boolean).join(' / '), subject: c.subject?.CN, validTo: c.valid_to, authorized: s.authorized, authError: s.authorizationError }
      s.end()
      resolve(res)
    })
    s.on('error', (e) => resolve({ error: e.message }))
    s.on('timeout', () => { s.destroy(); resolve({ error: 'timeout' }) })
  })
}

// ---------- 1. DNS ----------
const www = `www.${host}`
const [A, AAAA, MX, NS] = await Promise.all(['A', 'AAAA', 'MX', 'NS'].map((t) => doh(host, t)))
originIps = [...A.answers, ...AAAA.answers].filter((x) => /^\d+\.\d+\.\d+\.\d+$/.test(x))
add('DNS', 'A', A.answers.length ? 'PASS' : 'FAIL', A.answers.join(', ') || A.error || 'no records')
add('DNS', 'AAAA', 'INFO', AAAA.answers.join(', ') || 'none')
add('DNS', 'NS', NS.answers.length ? 'INFO' : 'WARN', NS.answers.join(', ') || NS.error || 'none')
const nsRu = NS.answers.filter((n) => /\.ru\.?$|reg\.ru|nic\.ru|timeweb|beget/i.test(n))
add('DNS', 'NS servers not Russian', nsRu.length ? 'FAIL' : 'PASS', nsRu.join(', '))
add('DNS', 'MX', MX.answers.length ? 'INFO' : 'WARN', MX.answers.join(', ') || 'none')
const mxHosts = MX.answers.map((m) => m.split(/\s+/)[1]?.replace(/\.$/, '')).filter(Boolean)
const mxRu = mxHosts.filter((h) => /\.ru$/i.test(h))
add('DNS', 'MX hosts not *.ru', mxRu.length ? 'FAIL' : 'PASS', mxRu.join(', '))
const wwwA = await doh(www, 'A')
add('DNS', `${www} resolves (www -> bare 301)`, wwwA.answers.length ? 'INFO' : 'WARN', wwwA.answers.join(', ') || 'no records')

// SPF/DMARC (informational; mail items are in the manual checklist)
const [spf, dmarc] = await Promise.all([doh(host, 'TXT'), doh(`_dmarc.${host}`, 'TXT')])
add('DNS', 'SPF', spf.answers.some((t) => /v=spf1/.test(t)) ? 'INFO' : 'WARN', spf.answers.filter((t) => /v=spf1/.test(t)).join(' ') || 'no SPF record')
add('DNS', 'DMARC', dmarc.answers.some((t) => /v=DMARC1/i.test(t)) ? 'INFO' : 'WARN', dmarc.answers.join(' ') || 'no DMARC record')

// ---------- 2. Origin IP / geolocation ----------
for (const ip of originIps.slice(0, 3)) {
  const g = await geo(ip)
  add('Hosting', `origin ${ip}`, g.status !== 'success' ? 'WARN' : isRuGeo(g) ? 'FAIL' : 'PASS', geoLine(g))
}
for (const h of mxHosts.slice(0, 3)) {
  const ips = (await doh(h, 'A')).answers
  if (ips[0]) {
    const g = await geo(ips[0])
    add('Hosting', `MX ${h} (${ips[0]})`, g.status !== 'success' ? 'WARN' : isRuGeo(g) ? 'FAIL' : 'PASS', geoLine(g))
  }
}
const rdap = await curl(['-L', `https://rdap.org/domain/${host}`])
try {
  const j = JSON.parse(rdap.out)
  const registrar = j.entities?.find((e) => e.roles?.includes('registrar'))?.vcardArray?.[1]?.find((v) => v[0] === 'fn')?.[3]
  add('Hosting', 'registrar (RDAP)', /reg\.ru|regru|r01|nic\.ru/i.test(registrar ?? '') ? 'FAIL' : 'INFO', registrar ?? 'not published')
} catch {
  add('Hosting', 'registrar (RDAP)', 'WARN', 'RDAP lookup failed - check WHOIS manually')
}

// ---------- 3. TLS + headers ----------
if (originIps[0]) {
  const t = await tlsInfo(originIps[0], host)
  if (t.error) add('TLS', 'certificate', 'FAIL', t.error)
  else {
    add('TLS', 'certificate chain valid for host', t.authorized ? 'PASS' : 'FAIL', t.authorized ? `subject ${t.subject}, expires ${t.validTo}` : t.authError)
    add('TLS', 'issuer not Russian', /russian|sber|minsvyaz|digital\.gov\.ru|ГУЦ|Минцифры/i.test(t.issuer) ? 'FAIL' : 'INFO', t.issuer)
  }
}
const root = await get(`${origin}/`)
add('HTTP', `GET ${origin}/`, root.status === 200 ? 'PASS' : 'FAIL', `status ${root.status}${root.error ? ' ' + root.error : ''}`)
const allCookies = [...root.setCookies]
add('HTTP', 'no `_locale` cookie', allCookies.some((c) => /^_locale=/i.test(c)) ? 'FAIL' : 'PASS', allCookies.map((c) => c.split(';')[0]).join(', ') || 'no cookies set on /')
const hv = Object.entries(root.headers).filter(([k, v]) => /(^|[^a-z])ru([^a-z]|$)|\.ru\b|yandex|nginx-ru|beget|timeweb/i.test(`${k}: ${v}`) && k !== 'content-language')
add('HTTP', 'response headers free of RU hosts', hv.length ? 'FAIL' : 'PASS', hv.map(([k, v]) => `${k}: ${v}`).join('; '))
add('HTTP', 'Content-Language / server', 'INFO', `content-language: ${root.headers['content-language'] ?? '-'}, server: ${root.headers.server ?? '-'}, date: ${root.headers.date ?? '-'}`)
add('HTTP', 'HSTS', root.headers['strict-transport-security'] ? 'PASS' : 'WARN', root.headers['strict-transport-security'] ?? 'missing')
// http -> https and www -> bare
const httpR = await get(`http://${host}/`)
add('HTTP', 'http:// redirects to https://', httpR.status >= 300 && httpR.status < 400 && /^https:\/\//i.test(httpR.headers.location ?? '') ? 'PASS' : 'FAIL', `status ${httpR.status} -> ${httpR.headers.location ?? '-'}`)
if (wwwA.answers[0]) {
  const w = await get(`https://${www}/`, ['--resolve', `${www}:443:${wwwA.answers[0]}`])
  add('HTTP', 'www redirects to bare (one 301)', w.status === 301 && (w.headers.location ?? '').startsWith(origin) ? 'PASS' : 'WARN', `status ${w.status} -> ${w.headers.location ?? '-'}`)
}

// ---------- 4. robots / sitemap / llms.txt ----------
const robots = await get(`${origin}/robots.txt`)
add('SEO', 'robots.txt', robots.status === 200 ? 'PASS' : 'FAIL', `status ${robots.status}`)
if (robots.status === 200) {
  add('SEO', 'robots.txt announces sitemap on this host', robots.body.includes(`Sitemap: ${origin}/`) ? 'PASS' : 'FAIL', (robots.body.match(/^Sitemap:.*$/im) ?? ['no Sitemap line'])[0])
}
const llms = await get(`${origin}/llms.txt`)
add('SEO', 'llms.txt', llms.status === 200 ? 'PASS' : 'WARN', `status ${llms.status}`)

async function sitemapUrls(url, depth = 0) {
  const r = await get(url)
  if (r.status !== 200) return { urls: [], status: r.status }
  const locs = [...r.body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, '&'))
  if (/<sitemapindex/i.test(r.body) && depth < 2) {
    const nested = await Promise.all(locs.map((l) => sitemapUrls(l, depth + 1)))
    return { urls: nested.flatMap((n) => n.urls), status: 200 }
  }
  return { urls: locs, status: 200 }
}
const sm = await sitemapUrls(`${origin}/sitemap.xml`)
add('SEO', 'sitemap.xml', sm.status === 200 && sm.urls.length ? 'PASS' : 'FAIL', `status ${sm.status}, ${sm.urls.length} URLs`)
const foreign = sm.urls.filter((u) => new URL(u).origin !== origin)
add('SEO', 'sitemap URLs all on this host', foreign.length ? 'FAIL' : 'PASS', foreign.slice(0, 5).join(', '))
for (const [name, body] of [['robots.txt', robots.body], ['llms.txt', llms.status === 200 ? llms.body : '']]) {
  const bad = scanText(body).filter((f) => !isAllowed(allowlist, name, f))
  add('Content', `${name} clean`, bad.length ? 'FAIL' : 'PASS', bad.slice(0, 5).map((f) => `${f.rule}:${f.match}`).join(', '))
}

// ---------- 5. page content ----------
const pages = [...new Set([`${origin}/`, ...sm.urls])].slice(0, maxPages)
const pageProblems = []
const hreflang = []
const queue = [...pages]
let fetched = 0
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const url = queue.shift()
      const r = await get(url)
      fetched++
      const p = new URL(url).pathname
      if (r.status !== 200) { pageProblems.push(`${p}: HTTP ${r.status}`); continue }
      if (!/<html\b[^>]*\blang=["']en/i.test(r.body)) pageProblems.push(`${p}: no lang="en"`)
      if (/hreflang=/i.test(r.body)) hreflang.push(p)
      if (r.setCookies.some((c) => /^_locale=/i.test(c))) pageProblems.push(`${p}: sets _locale cookie`)
      const canon = r.body.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)
      if (!canon || !canon[1].startsWith(origin)) pageProblems.push(`${p}: canonical ${canon ? canon[1] : 'missing'}`)
      for (const f of scanText(r.body)) {
        if (isAllowed(allowlist, p, f)) continue
        pageProblems.push(`${p}:${f.line}:${f.col} [${f.rule}] ${f.match}`)
      }
    }
  }),
)
add('Content', `pages fetched from sitemap (${fetched})`, fetched > 0 ? 'INFO' : 'FAIL', fetched ? '' : 'nothing to audit')
add('Content', 'pages: 200, lang="en", canonical on host, no RU traces', pageProblems.length ? 'FAIL' : fetched ? 'PASS' : 'FAIL',
  pageProblems.length ? `${pageProblems.length} problem(s); first: ${pageProblems.slice(0, 8).join('; ')}` : '')
add('Content', 'no hreflang alternates (no link to the RU site)', hreflang.length ? 'FAIL' : 'PASS', hreflang.slice(0, 5).join(', '))

// ---------- report ----------
const counts = rows.reduce((a, r) => ((a[r.status] = (a[r.status] ?? 0) + 1), a), {})
const verdict = counts.FAIL ? 'FAIL' : 'PASS'
const out = []
out.push(`## EN release audit: ${origin}`)
out.push('')
out.push(`Run: ${new Date().toISOString()} - verdict **${verdict}** (${Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(', ')})`)
out.push('')
out.push('| Area | Check | Status | Detail |')
out.push('|---|---|---|---|')
for (const r of rows) out.push(`| ${r.area} | ${esc(r.check)} | ${r.status} | ${esc(r.detail).slice(0, 400)} |`)
out.push('')
out.push('Manual items not covered by this script: see `docs/en-release-checklist.md`.')
console.log(out.join('\n'))
process.exit(counts.FAIL ? 1 : 0)
