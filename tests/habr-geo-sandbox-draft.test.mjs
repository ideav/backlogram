import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

const manifestPath = new URL('../content/habr-sandbox-geo/manifest.json', import.meta.url)
const draftPath = new URL(
  '../content/habr-sandbox-geo/drafts/prikladnoe-geo-optimizaciya-dlya-generativnyh-sistem.md',
  import.meta.url,
)

function readJson(url) {
  return JSON.parse(readFileSync(url, 'utf8'))
}

test('GEO Habr sandbox pipeline tracks the requested source article', () => {
  assert.ok(existsSync(manifestPath), 'expected Habr GEO sandbox manifest to exist')

  const manifest = readJson(manifestPath)

  assert.equal(manifest.pipeline, 'habr-sandbox-geo')
  assert.deepEqual(manifest.targetPlatforms, ['Habr'])
  assert.equal(
    manifest.sourceUrl,
    'https://blog.ideav.ru/posts/prikladnoe-geo-optimizaciya-dlya-generativnyh-sistem/',
  )
  assert.equal(manifest.status, 'author_review')
  assert.equal(
    manifest.draftPath,
    'drafts/prikladnoe-geo-optimizaciya-dlya-generativnyh-sistem.md',
  )
})

test('GEO Habr draft is structured for sandbox review and author fact-check', () => {
  assert.ok(existsSync(draftPath), 'expected Habr GEO sandbox draft to exist')

  const draft = readFileSync(draftPath, 'utf8')

  assert.match(draft, /format: habr_sandbox_article/)
  assert.match(draft, /status: author_review/)
  assert.match(draft, /targetPlatforms:\n  - Habr/)
  assert.match(draft, /needsHumanAuthorRewrite: true/)
  assert.match(draft, /Generative Engine Optimization/)
  assert.match(draft, /таблиц/)
  assert.match(draft, /FAQ/)
  assert.match(draft, /фактическ/)
  assert.match(draft, /связанных материалов/)
  assert.match(draft, /schema\.org/)
  assert.match(draft, /llms\.txt/)
  assert.match(draft, /robots\.txt/)
  assert.match(draft, /Фактчек перед отправкой/)
  assert.match(draft, /Вопросы к комментариям/)
})
