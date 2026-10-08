// Static guards for the English engine (site-en/engine) and site sources (site-en/src).
// Issue #701.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ENGINE = path.join(ROOT, 'site-en', 'engine')
const TEXT = /\.(php|html|js|mjs|ts|tsx|vue|css|sql|md|json|txt|example)$/i

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (TEXT.test(e.name) || e.name.startsWith('.env')) out.push(p)
  }
  return out
}
const rel = p => path.relative(ROOT, p).split(path.sep).join('/')

test('no literal production domain in the engine or the site sources (any domain must work)', () => {
  const offenders = []
  for (const dir of [ENGINE, path.join(ROOT, 'site-en', 'src')]) {
    for (const f of walk(dir)) {
      const s = fs.readFileSync(f, 'utf8')
      const m = s.match(/.{0,40}(ideav\.pro|integram-ai\.online).{0,20}/i)
      if (m) offenders.push(`${rel(f)}: ${m[0].trim()}`)
    }
  }
  assert.deepEqual(offenders, [], 'take the host from the request (engine) or SITE_URL (static build)')
})

test('no merge-conflict markers in the engine', () => {
  const offenders = walk(ENGINE).filter(f => /^(<{7}|>{7}) /m.test(fs.readFileSync(f, 'utf8'))).map(rel)
  assert.deepEqual(offenders, [])
})

// The engine's template parser treats a braced word ({name}) outside a <!-- Begin: X --> block as
// an insertion point of the page block; with no data for it the whole page renders empty.
test('workspace pages have no stray insertion points outside data blocks', () => {
  for (const name of ['calendar', 'kanban', 'dash', 'info', 'cards']) {
    let s = fs.readFileSync(path.join(ENGINE, 'templates', name + '.html'), 'utf8')
    s = s.replace(/<!-- Begin:\s*([^>]+?)\s*-->[\s\S]*?<!-- End:\s*\1\s*-->/gi, '')
    // Parse_block(): /\{([A-Z\x{0410}-\x{042F}0-9_ \-]+?[^ ;\r\n])}/ui and the point collector with "."
    const points = [...s.matchAll(/\{([A-Za-z0-9_ .&-]+?[^ ;\r\n{}])\}/g)].map(m => m[0])
      .filter(p => !/^\{_(global|request|parent)_\./i.test(p))
    assert.deepEqual(points, [], `${name}.html`)
  }
})

test('the calendar uses report and table names, not ids of another installation', () => {
  const s = fs.readFileSync(path.join(ENGINE, 'templates', 'calendar.html'), 'utf8')
  assert.doesNotMatch(s, /report\/\d+/)
  assert.doesNotMatch(s, /['"]t\d{3,}['"]/)
  assert.doesNotMatch(s, /locale:\s*'ru'/)
})

test('the en template seeds the starter tables, reports and boards the pages read by name', () => {
  const seed = fs.readFileSync(path.join(ENGINE, 'db', 'seed-en.sql'), 'utf8')
  for (const name of ['Task', 'Task status', 'Task type', 'Project', 'Contact', 'Deal', 'Deal stage',
    'Calendar tasks', 'All task statuses', 'All task types', 'Assignees', 'User reports', 'User forms',
    'Sales pipeline', 'kanban446', 'kanban540']) {
    assert.ok(seed.includes(`,'${name}')`), `seed-en.sql lacks '${name}'`)
  }
  const cal = fs.readFileSync(path.join(ENGINE, 'templates', 'calendar.html'), 'utf8')
  for (const name of ['Calendar%20tasks', 'All%20task%20statuses', 'All%20task%20types', 'Assignees']) {
    assert.ok(cal.includes(name), `calendar.html does not read ${name}`)
  }
})

test('the free-plan workspace limit is configurable and points to /pricing', () => {
  const site = fs.readFileSync(path.join(ENGINE, 'include', 'en_site.php'), 'utf8')
  const index = fs.readFileSync(path.join(ENGINE, 'index.php'), 'utf8')
  const cabinet = fs.readFileSync(path.join(ENGINE, 'js', 'cabinet.js'), 'utf8')
  assert.match(site, /INTEGRAM_MAX_WORKSPACES/)
  assert.match(site, /\/pricing/)
  assert.doesNotMatch(index, /"dbs"\] >= 3/)
  assert.doesNotMatch(cabinet, /databases\.length >= 3/)
})

test('"Excel to app" sign-up lands on the file import, not the workspace home (#718)', () => {
  const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8')
  const page = read('site-en/src/pages/ExcelToApp.tsx')
  assert.doesNotMatch(page, /\bSIGNUP_PATH\b/)
  assert.match(page, /<Button to=\{SIGNUP_UPLOAD_PATH\}[^>]*>\s*Upload your file free/)
  assert.match(read('site-en/src/site.ts'), /SIGNUP_UPLOAD_PATH = '\/start\?next=upload#signup'/)
  assert.match(read('site-en/engine/start.php'), /\['upload'\]\.indexOf\(qs\.get\('next'\)\) >= 0\) try \{ localStorage\.setItem\('en_next'/)
  const app = read('site-en/engine/js/main-app.js')
  assert.match(app, /localStorage\.removeItem\('en_next'\)/)
  assert.match(app, /location\.replace\('\/' \+ home\[1\] \+ '\/upload'\)/)
})

test('closing CTA band leads to the file import; no Google/GitHub promise on pages (#722)', () => {
  const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8')
  assert.match(read('site-en/src/components/ui.tsx'), /to = SIGNUP_UPLOAD_PATH,/)
  for (const p of ['Home', 'Ai', 'ExcelToApp', 'Compare', 'UseCases']) {
    assert.doesNotMatch(read(`site-en/src/pages/${p}.tsx`), /Google or GitHub/, p)
  }
})
