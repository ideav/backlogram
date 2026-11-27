// Векторный слой поиска помощи /help.html (backlogram#1039).
//
// Векторы статей считаются при сборке (scripts/build-help-vectors.mjs) и лежат в
// /help-vectors.json; вектор вопроса считает agent.ideav.ru/agent/help-embed той же моделью.
// Близость смешивается с BM25 из helpSearch.mjs: у bge-m3 косинус любых русских фраз
// 0.65–0.80 (замер crm#5654), поэтому берётся не сам косинус, а насколько статья выделяется
// среди всех статей на этот вопрос (z-оценка). Нет векторов или сервер молчит — работает BM25.
import { search } from './helpSearch.mjs'

export const HELP_EMBED_ENDPOINT = 'https://agent.ideav.ru/agent/help-embed'
export const HELP_VECTORS_URL = '/help-vectors.json'

// Параметры смешивания подобраны замером на tests/fixtures/help-paraphrases.mjs.
export const HYBRID = { weight: 0.5, zFloor: 2, zConfident: 5 }

const clean = (s) => String(s ?? '').replace(/`/g, '').replace(/\s+/g, ' ').trim()

/** Текст статьи, по которому считается её вектор: как её назвал бы клиент. */
export function embedText(a) {
  return [a.title, ...(a.ask ?? []), a.summary].map(clean).filter(Boolean).join('. ')
}

/** FNV-1a 32 — метка текста: изменилась статья — её вектор устарел и не используется. */
export function textHash(s) {
  let h = 0x811c9dc5
  for (const ch of String(s)) {
    h ^= ch.codePointAt(0)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(16).padStart(8, '0')
}

const b64 = typeof Buffer !== 'undefined'
  ? { enc: (u8) => Buffer.from(u8).toString('base64'), dec: (s) => new Uint8Array(Buffer.from(s, 'base64')) }
  : { enc: (u8) => btoa(String.fromCharCode(...u8)), dec: (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0)) }

/** float-вектор → int8 в base64 (масштаб не хранится: косинусу он не важен). */
export function packVector(vec) {
  const max = Math.max(...vec.map(Math.abs)) || 1
  const i8 = new Int8Array(vec.map((x) => Math.round((x / max) * 127)))
  return b64.enc(new Uint8Array(i8.buffer))
}

function unit(v) {
  let n = 0
  for (const x of v) n += x * x
  n = Math.sqrt(n) || 1
  return Float32Array.from(v, (x) => x / n)
}

/** Разобрать help-vectors.json: Map id → единичный вектор; устаревшие статьи пропускаются. */
export function loadVectors(json, articles) {
  const out = new Map()
  if (!json || !json.items) return { model: null, vectors: out }
  for (const a of articles) {
    const item = json.items[a.id]
    if (!item || item[0] !== textHash(embedText(a))) continue
    out.set(a.id, unit(new Int8Array(b64.dec(item[1]).buffer)))
  }
  return { model: json.model, vectors: out }
}

/** Вектор вопроса с сервера; null — не ответил вовремя или ошибка. */
export async function fetchQueryVector(q, { endpoint = HELP_EMBED_ENDPOINT, timeoutMs = 2500, fetchImpl = fetch } = {}) {
  const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null
  const timer = ctl && setTimeout(() => ctl.abort(), timeoutMs)
  try {
    // text/plain — «простой» запрос: браузер не тратит время на preflight.
    const r = await fetchImpl(endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ q }), signal: ctl?.signal })
    if (!r.ok) return null
    const data = await r.json()
    return Array.isArray(data?.vec) && data.vec.length ? { model: data.model, vec: data.vec } : null
  } catch {
    return null
  } finally {
    if (timer) clearTimeout(timer)
  }
}

/** Лучшие статьи с учётом близости: [{ article, score }] по убыванию. */
export function hybridSearch(index, q, qvec, vectors, limit = 10, p = HYBRID) {
  const lexical = search(index, q, index.N)
  if (!qvec || !vectors?.size) return lexical.slice(0, limit)
  const top = lexical[0]?.score || 1
  const lex = new Map(lexical.map((h) => [h.article.id, h.score / top]))
  const qv = unit(qvec)
  const cos = []
  for (const d of index.docs) {
    const v = vectors.get(d.article.id)
    if (!v) continue
    let s = 0
    for (let i = 0; i < v.length; i++) s += v[i] * qv[i]
    cos.push([d.article, s])
  }
  const mean = cos.reduce((s, [, c]) => s + c, 0) / Math.max(cos.length, 1)
  const sd = Math.sqrt(cos.reduce((s, [, c]) => s + (c - mean) ** 2, 0) / Math.max(cos.length, 1)) || 1
  const out = []
  for (const [article, c] of cos) {
    const z = (c - mean) / sd
    const score = (lex.get(article.id) ?? 0) + p.weight * Math.max(0, z - p.zFloor)
    if (score > 0) out.push({ article, score, z })
  }
  const seen = new Set(out.map((h) => h.article.id))
  for (const h of lexical) if (!seen.has(h.article.id)) out.push({ article: h.article, score: h.score / top, z: 0 })
  return out.sort((x, y) => y.score - x.score).slice(0, limit)
}

/** Ответ консультанта в форме consult(): лучшая статья + похожие. */
export function hybridConsult(index, q, qvec, vectors, p = HYBRID) {
  const found = hybridSearch(index, q, qvec, vectors, 6, p)
  if (!found.length) return { best: null, related: [], confident: false }
  const [first, ...rest] = found
  const related = rest.filter((r) => r.score >= first.score * 0.35).slice(0, 4).map((r) => r.article)
  const lexTop = search(index, q, 1)[0]
  const confident = (lexTop?.article.id === first.article.id && lexTop.score >= 2.5) || (first.z ?? 0) >= p.zConfident
  return { best: first.article, related, confident, score: first.score }
}
