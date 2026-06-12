import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { test } from 'node:test'

const repo = new URL('..', import.meta.url).pathname
const footerSource = readFileSync(resolve(repo, 'src/components/Footer.tsx'), 'utf8')
const indexHtml = readFileSync(resolve(repo, 'index.html'), 'utf8')
const noticeLine = 'В реестре отечественного ПО'
const entryLine = 'Реестровая запись №30872'

test('main footer shows the registry notice', () => {
  assert.ok(footerSource.includes(noticeLine))
  assert.ok(footerSource.includes(entryLine))
})

test('landing prerender exposes the registry notice to no-JS clients', () => {
  const work = mkdtempSync(resolve(tmpdir(), 'lp-registry-notice-'))
  mkdirSync(resolve(work, 'dist'), { recursive: true })
  mkdirSync(resolve(work, 'scripts'), { recursive: true })
  cpSync(resolve(repo, 'scripts/prerender-landing.mjs'), resolve(work, 'scripts/prerender-landing.mjs'))
  writeFileSync(resolve(work, 'dist/index.html'), indexHtml)

  execFileSync('node', ['scripts/prerender-landing.mjs'], { cwd: work })
  const out = readFileSync(resolve(work, 'dist/index.html'), 'utf8')

  assert.ok(out.includes(noticeLine))
  assert.ok(out.includes(entryLine))
})
