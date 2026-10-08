import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'site-en', 'src', 'content')
const kbDir = join(root, 'kb')
const ucFile = join(root, 'usecases', 'index.ts')

const SLUGS = [
  'crm', 'inventory', 'orders', 'project-tracking', 'hr-onboarding',
  'asset-management', 'ai-knowledge-base', 'client-portal', 'field-service', 'budgeting',
]

const kbFiles = readdirSync(kbDir).filter((f) => f.endsWith('.ts'))
const articleFiles = kbFiles.filter((f) => !['index.ts', 'blocks.ts'].includes(f))
const read = (p) => readFileSync(p, 'utf8')

// Words of the human-readable text only: contents of single-quoted string literals
// that are not import paths or type names.
function proseWords(src) {
  const body = src.slice(src.indexOf('blocks: ['))
  const strings = [...body.matchAll(/'((?:[^'\\\n]|\\.)*)'/g)].map((m) => m[1])
  return strings.join(' ').split(/\s+/).filter(Boolean).length
}

test('use cases: exactly the 10 agreed slugs, each complete', () => {
  const src = read(ucFile)
  const slugs = [...src.matchAll(/^\s{4}slug: '([^']+)'/gm)].map((m) => m[1])
  assert.deepEqual([...slugs].sort(), [...SLUGS].sort())
  for (const s of SLUGS) {
    assert.ok(src.includes(`image: '/img/uc-${s}.png'`), `image for ${s}`)
  }
})

test('knowledge base: at least 8 articles with unique slugs', () => {
  const idx = read(join(kbDir, 'index.ts'))
  const listed = [...idx.matchAll(/import \{ article as (\w+) \} from '\.\/([\w-]+)'/g)]
  assert.ok(listed.length >= 8, `only ${listed.length} articles imported`)
  const slugs = []
  for (const f of articleFiles) {
    const m = read(join(kbDir, f)).match(/^\s{2}slug: '([^']+)'/m)
    assert.ok(m, `slug in ${f}`)
    slugs.push(m[1])
  }
  assert.ok(slugs.length >= 8)
  assert.equal(new Set(slugs).size, slugs.length, 'duplicate article slugs')
  for (const l of listed) assert.ok(articleFiles.includes(`${l[2]}.ts`), `${l[2]} exists`)
})

test('knowledge base: each article is 900-1600 words', () => {
  for (const f of articleFiles) {
    const n = proseWords(read(join(kbDir, f)))
    assert.ok(n >= 900 && n <= 1600, `${f}: ${n} words`)
  }
})

test('content has no Cyrillic, .ru, or the ruble sign', () => {
  const files = [...kbFiles.map((f) => join(kbDir, f)), ucFile, join(root, 'types.ts')]
  for (const f of files) {
    const src = read(f)
    assert.ok(!/[Ѐ-ӿ]/.test(src), `Cyrillic in ${f}`)
    assert.ok(!/\.ru\b/i.test(src), `.ru in ${f}`)
    assert.ok(!src.includes('₽'), `ruble sign in ${f}`)
  }
})
