// ideav/courses#106 — база cources переименована в courses (опечатка). Старые адреса
// портала, его статики и ссылки оплаты обязаны вести на новые, а правила — стоять
// выше front controller, иначе /cources/... уйдёт в движок как имя старой базы.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = fileURLToPath(new URL('..', import.meta.url))
const ht = readFileSync(resolve(repo, 'public/.htaccess'), 'utf8')
const lines = ht.split(/\r?\n/).map((l) => l.trim())

// Правила с cources в порядке файла: [условие метода | null, шаблон, замена, флаги]
const rules = []
let cond = null
for (const l of lines) {
  const c = l.match(/^RewriteCond %\{REQUEST_METHOD\} (\S+)/)
  if (c) { cond = new RegExp(c[1]); continue }
  const r = l.match(/^RewriteRule (\S+) (\S+) \[(.+)\]$/)
  if (r && r[1].includes('cources')) rules.push({ cond, re: new RegExp(r[1]), to: r[2], flags: r[3] })
  if (!l.startsWith('RewriteCond')) cond = null
}

/** Эмуляция mod_rewrite для правил cources: путь без ведущего «/» → [код, адрес] или null. */
function redirect(method, path) {
  for (const r of rules) {
    if (r.cond && !r.cond.test(method)) continue
    const m = path.match(r.re)
    if (!m) continue
    const to = r.to.replace(/\$(\d)/g, (_, i) => m[i] ?? '')
    return [Number(r.flags.match(/R=(\d+)/)[1]), to]
  }
  return null
}

test('портал, статика и оплата: GET → 301 на courses', () => {
  assert.deepEqual(redirect('GET', 'cources'), [301, '/courses'])
  assert.deepEqual(redirect('GET', 'cources/'), [301, '/courses/'])
  assert.deepEqual(redirect('GET', 'cources/object/1411/'), [301, '/courses/object/1411/'])
  assert.deepEqual(redirect('HEAD', 'download/cources/js/lms.js'), [301, '/download/courses/js/lms.js'])
  assert.deepEqual(redirect('GET', 'cources-pay.php'), [301, '/courses-pay.php'])
})

test('POST сохраняет метод: 308', () => {
  assert.deepEqual(redirect('POST', 'cources/auth'), [308, '/courses/auth'])
  assert.deepEqual(redirect('POST', 'download/cources/x'), [308, '/download/courses/x'])
})

test('чужие пути не задеты', () => {
  for (const p of ['courses/', 'courcesx', 'my/cources', 'download/courses/js/a.js', 'kurs/adept.html']) {
    assert.equal(redirect('GET', p), null, p)
  }
})

test('правила cources выше front controller', () => {
  const fc = lines.indexOf('RewriteRule ^ index.php [L,QSA]')
  const last = lines.findLastIndex((l) => l.startsWith('RewriteRule') && l.includes('cources'))
  assert.ok(fc > 0 && last > 0 && last < fc)
})
