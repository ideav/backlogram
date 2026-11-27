// Гибридный поиск помощи: BM25 + близость bge-m3 (backlogram#1039).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildIndex, search } from '../src/lib/helpSearch.mjs'
import { loadVectors, hybridSearch, hybridConsult, fetchQueryVector, embedText, textHash, packVector } from '../src/lib/helpVectors.mjs'
import { HELP_ARTICLES } from '../src/data/helpCenter.mjs'
import { staleArticles } from '../scripts/build-help-vectors.mjs'
import { HELP_PARAPHRASES } from './fixtures/help-paraphrases.mjs'
import { HELP_LEXICAL, hit } from './fixtures/help-lexical-questions.mjs'

const json = JSON.parse(readFileSync(new URL('../public/help-vectors.json', import.meta.url), 'utf8'))
const queries = JSON.parse(readFileSync(new URL('./fixtures/help-query-vectors.json', import.meta.url), 'utf8'))
const index = buildIndex(HELP_ARTICLES)
const { vectors, model } = loadVectors(json, HELP_ARTICLES)
const qvec = (q) => {
  assert.ok(queries.queries[q], `нет вектора вопроса «${q}» — node scripts/build-help-vectors.mjs --shim … --eval`)
  return Array.from(new Int8Array(new Uint8Array(Buffer.from(queries.queries[q], 'base64')).buffer))
}
const top = (fn, set, n) => set.filter(([q, e]) => fn(q).slice(0, n).some((h) => hit(h.article, e))).length

test('векторы статей актуальны и той же модели, что вопросы замера', () => {
  const stale = staleArticles(json)
  assert.deepEqual(stale.map((a) => a.id), [], 'статьи изменились — пересчитайте: node scripts/build-help-vectors.mjs --shim <шим>/v1')
  assert.equal(vectors.size, HELP_ARTICLES.length)
  assert.equal(model, queries.model)
})

test('гибрид находит перефразы лучше BM25 и не теряет то, что BM25 находил', () => {
  const bm = (q) => search(index, q, 3)
  const hy = (q) => hybridSearch(index, q, qvec(q), vectors, 3)
  // Замер 27.11.2026: BM25 29/41 из 50 (топ-1/топ-3), гибрид 40/48.
  assert.ok(top(hy, HELP_PARAPHRASES, 1) >= 38, `топ-1 перефразов: ${top(hy, HELP_PARAPHRASES, 1)}`)
  assert.ok(top(hy, HELP_PARAPHRASES, 3) >= 46, `топ-3 перефразов: ${top(hy, HELP_PARAPHRASES, 3)}`)
  assert.ok(top(hy, HELP_PARAPHRASES, 3) > top(bm, HELP_PARAPHRASES, 3))
  for (const [q, e] of HELP_LEXICAL) {
    if (bm(q).some((h) => hit(h.article, e))) assert.ok(hy(q).some((h) => hit(h.article, e)), `гибрид потерял «${q}»`)
  }
})

test('без вектора вопроса или без векторов статей — ровно BM25', () => {
  for (const q of ['куда делась моя таблица', 'загрузить данные из Excel']) {
    const ids = search(index, q, 5).map((h) => h.article.id)
    assert.deepEqual(hybridSearch(index, q, null, vectors, 5).map((h) => h.article.id), ids)
    assert.deepEqual(hybridSearch(index, q, qvec(q), new Map(), 5).map((h) => h.article.id), ids)
  }
  assert.equal(hybridConsult(index, 'и или но', null, vectors).best, null)
})

test('изменённая статья теряет вектор, а не получает чужой', () => {
  const [a] = HELP_ARTICLES
  const changed = [{ ...a, summary: a.summary + ' Новое.' }]
  assert.equal(loadVectors(json, changed).vectors.size, 0)
  assert.equal(json.items[a.id][0], textHash(embedText(a)))
})

test('packVector: int8 сохраняет направление', () => {
  const v = [0.3, -0.1, 0.05, 0]
  const one = { id: 'x', title: 't', summary: 's' }
  const back = loadVectors({ model: 'm', items: { x: [textHash(embedText(one)), packVector(v)] } }, [one]).vectors.get('x')
  const n = Math.hypot(...v)
  v.forEach((x, i) => assert.ok(Math.abs(back[i] - x / n) < 0.01))
})

test('вектор вопроса: text/plain, а сбой и таймаут — null', async () => {
  let seen
  const ok = async (url, init) => { seen = init; return { ok: true, json: async () => ({ model: 'Xenova/bge-m3', vec: [1, 2] }) } }
  assert.deepEqual(await fetchQueryVector('таблица', { fetchImpl: ok }), { model: 'Xenova/bge-m3', vec: [1, 2] })
  assert.equal(seen.headers['Content-Type'], 'text/plain')
  assert.deepEqual(JSON.parse(seen.body), { q: 'таблица' })
  assert.equal(await fetchQueryVector('q', { fetchImpl: async () => ({ ok: false }) }), null)
  assert.equal(await fetchQueryVector('q', { fetchImpl: async () => { throw new Error('offline') } }), null)
  const hang = (url, init) => new Promise((_, rej) => init.signal.addEventListener('abort', () => rej(new Error('abort'))))
  assert.equal(await fetchQueryVector('q', { fetchImpl: hang, timeoutMs: 20 }), null)
})
