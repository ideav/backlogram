import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const manifestPath = new URL(
  '../content/habr-vc-personal-experience/manifest.json',
  import.meta.url,
)
const draft11HabrPath = new URL(
  '../content/habr-vc-personal-experience/drafts/11-ai-interface-data-safety.md',
  import.meta.url,
)
const draft11VcPath = new URL(
  '../content/habr-vc-personal-experience/drafts/11-ai-interface-data-safety.vc.md',
  import.meta.url,
)

function readJson(url) {
  return JSON.parse(readFileSync(url, 'utf8'))
}

test('Habr/VC personal-experience pipeline is separate from the live knowledge base', () => {
  const manifest = readJson(manifestPath)

  assert.equal(manifest.pipeline, 'habr-vc-personal-experience')
  assert.deepEqual(manifest.targetPlatforms, ['Habr', 'VC.ru'])
  assert.equal(manifest.sourceCollection, 'knowledgeBaseArticles')
  assert.equal(manifest.articles.length, 18)
  assert.equal(
    manifest.articles.some((article) => article.slug === '08a-vibe-coding-templates'),
    false,
    'supplemental article 08a should not be part of the 18-article publication pipeline',
  )
})

test('article #11 is the first Habr/VC draft and is assigned to author review', () => {
  const manifest = readJson(manifestPath)
  const article11 = manifest.articles.find(
    (article) => article.slug === '11-ai-interface-data-safety',
  )

  assert.ok(article11, 'article #11 should be listed in the Habr/VC pipeline')
  assert.equal(article11.number, '11')
  assert.equal(article11.topic, 'вайб-кодинг')
  assert.equal(article11.status, 'author_review')
  assert.equal(article11.draftOwner, 'author')
  assert.equal(article11.draftPath, 'drafts/11-ai-interface-data-safety.md')
})

test('article #11 split Habr and VC drafts stay in the personal-experience pipeline', () => {
  const habrDraft = readFileSync(draft11HabrPath, 'utf8')
  const vcDraft = readFileSync(draft11VcPath, 'utf8')

  assert.match(habrDraft, /format: habr_analytical/)
  assert.match(habrDraft, /status: author_review/)
  assert.match(habrDraft, /targetPlatforms:\n  - Habr/)
  assert.match(habrDraft, /ИИ делает интерфейс/)
  assert.match(habrDraft, /данные, права и история/)
  assert.match(habrDraft, /Интеграм/)
  assert.match(habrDraft, /Фактчек перед публикацией/)

  assert.match(vcDraft, /format: personal_experience/)
  assert.match(vcDraft, /status: author_review/)
  assert.match(vcDraft, /targetPlatforms:\n  - VC\.ru/)
  assert.match(vcDraft, /я решил/)
  assert.match(vcDraft, /мы получили/)
  assert.match(vcDraft, /что я вынес/)
  assert.match(vcDraft, /ИИ делает интерфейс/)
  assert.match(vcDraft, /данные, права и история/)
  assert.match(vcDraft, /Интеграм/)
  assert.match(vcDraft, /Фактчек перед публикацией/)
})
