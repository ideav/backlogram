import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

const manifestPath = new URL('../content/habr-sandbox-geo/manifest.json', import.meta.url)
const articlePath = new URL(
  '../content/habr-sandbox-geo/articles/prikladnoe-geo-optimizaciya-dlya-generativnyh-sistem.md',
  import.meta.url,
)

function readJson(url) {
  return JSON.parse(readFileSync(url, 'utf8'))
}

test('GEO Habr sandbox publication package tracks the requested source article', () => {
  assert.ok(existsSync(manifestPath), 'expected Habr GEO sandbox manifest to exist')

  const manifest = readJson(manifestPath)

  assert.equal(manifest.pipeline, 'habr-sandbox-geo')
  assert.deepEqual(manifest.targetPlatforms, ['Habr'])
  assert.equal(
    manifest.sourceUrl,
    'https://blog.ideav.ru/posts/prikladnoe-geo-optimizaciya-dlya-generativnyh-sistem/',
  )
  assert.equal(manifest.status, 'ready')
  assert.equal(manifest.draftPath, undefined)
  assert.equal(
    manifest.articlePath,
    'articles/prikladnoe-geo-optimizaciya-dlya-generativnyh-sistem.md',
  )
})

test('GEO Habr article is ready to publish without visible draft scaffolding', () => {
  assert.ok(existsSync(articlePath), 'expected Habr GEO sandbox article to exist')

  const article = readFileSync(articlePath, 'utf8')

  assert.match(article, /format: habr_sandbox_article/)
  assert.match(article, /status: ready/)
  assert.match(article, /targetPlatforms:\n  - Habr/)
  assert.doesNotMatch(article, /needsHumanAuthorRewrite/)
  assert.doesNotMatch(article, /EDITOR:|AUTHOR:/)
  assert.doesNotMatch(article, /Варианты заголовка/)
  assert.doesNotMatch(article, /Фактчек перед отправкой/)
  assert.doesNotMatch(article, /черновик|draft/i)
  assert.match(article, /Generative Engine Optimization/)
  assert.match(article, /таблиц/)
  assert.match(article, /FAQ/)
  assert.match(article, /фактическ/)
  assert.match(article, /связанных материалов/)
  assert.match(article, /schema\.org/)
  assert.match(article, /llms\.txt/)
  assert.match(article, /robots\.txt/)
  assert.match(article, /Вопросы к комментариям/)
})
