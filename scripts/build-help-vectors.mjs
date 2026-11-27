// Векторы статей помощи для гибридного поиска /help.html (backlogram#1039).
//
//   node scripts/build-help-vectors.mjs --shim http://127.0.0.1:18098/v1   # пересчитать изменённые
//   node scripts/build-help-vectors.mjs --check                            # есть ли устаревшие
//   node scripts/build-help-vectors.mjs --shim … --eval                    # + векторы вопросов замера
//
// --shim — OpenAI-совместимый /v1/embeddings той же модели, что у agent.ideav.ru/agent/help-embed
// (шим bge-m3 на песочнице, наружу не опубликован — через ssh -L, см. agent-chat README в
// ideav/python2node). Пересчитываются только статьи, чей текст изменился (метка textHash).
// Результат — public/help-vectors.json, его коммитят: сборка сайта сети не требует.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { HELP_ARTICLES, HELP_SAMPLE_QUESTIONS } from '../src/data/helpCenter.mjs'
import { embedText, textHash, packVector } from '../src/lib/helpVectors.mjs'

const MODEL = 'Xenova/bge-m3'
const OUT = fileURLToPath(new URL('../public/help-vectors.json', import.meta.url))
const EVAL_OUT = fileURLToPath(new URL('../tests/fixtures/help-query-vectors.json', import.meta.url))

const arg = (name) => {
  const i = process.argv.indexOf(name)
  return i > 0 ? process.argv[i + 1] : undefined
}
const shim = arg('--shim') ?? process.env.HELP_EMBED_SHIM

export function readVectors(path = OUT) {
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : { model: MODEL, dims: 0, items: {} }
}

export function staleArticles(json, articles = HELP_ARTICLES) {
  return articles.filter((a) => json.model !== MODEL || json.items?.[a.id]?.[0] !== textHash(embedText(a)))
}

async function embed(texts) {
  const out = []
  for (let i = 0; i < texts.length; i += 16) {
    const r = await fetch(shim.replace(/\/$/, '') + '/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, input: texts.slice(i, i + 16) }),
    })
    if (!r.ok) throw new Error(`шим ответил ${r.status}: ${await r.text()}`)
    const data = (await r.json()).data.sort((a, b) => a.index - b.index)
    out.push(...data.map((d) => d.embedding))
    process.stderr.write(`\r${out.length}/${texts.length}`)
  }
  process.stderr.write('\n')
  return out
}

// Одна статья — одна строка: правка статьи даёт в диффе одну строку.
function write(json) {
  const ids = Object.keys(json.items).sort()
  const lines = ids.map((id) => `    ${JSON.stringify(id)}: ${JSON.stringify(json.items[id])}`)
  writeFileSync(OUT, `{\n  "model": ${JSON.stringify(json.model)},\n  "dims": ${json.dims},\n  "items": {\n${lines.join(',\n')}\n  }\n}\n`)
}

async function main() {
  const json = readVectors()
  const stale = staleArticles(json)
  if (process.argv.includes('--check')) {
    if (stale.length) {
      console.error(`Устарели векторы ${stale.length} статей: ${stale.slice(0, 10).map((a) => a.id).join(', ')}…`)
      console.error('Пересчитайте: node scripts/build-help-vectors.mjs --shim <адрес шима>/v1')
      process.exit(1)
    }
    console.log(`Векторы актуальны: ${HELP_ARTICLES.length} статей`)
    return
  }
  if (!shim) throw new Error('Нужен --shim <адрес>/v1 или HELP_EMBED_SHIM')
  const items = json.model === MODEL ? { ...json.items } : {}
  const known = new Set(HELP_ARTICLES.map((a) => a.id))
  for (const id of Object.keys(items)) if (!known.has(id)) delete items[id]
  if (stale.length) {
    const vecs = await embed(stale.map(embedText))
    stale.forEach((a, i) => { items[a.id] = [textHash(embedText(a)), packVector(vecs[i])] })
    json.dims = vecs[0].length
  }
  write({ model: MODEL, dims: json.dims, items })
  console.log(`Пересчитано ${stale.length}, всего ${Object.keys(items).length}`)

  if (process.argv.includes('--eval')) {
    const { HELP_PARAPHRASES } = await import('../tests/fixtures/help-paraphrases.mjs')
    const qs = [...new Set([...HELP_PARAPHRASES.map(([q]) => q), ...HELP_SAMPLE_QUESTIONS, ...(await import('../tests/fixtures/help-lexical-questions.mjs')).HELP_LEXICAL.map(([q]) => q)])]
    const vecs = await embed(qs)
    const out = Object.fromEntries(qs.map((q, i) => [q, packVector(vecs[i])]))
    writeFileSync(EVAL_OUT, JSON.stringify({ model: MODEL, queries: out }, null, 0) + '\n')
    console.log(`Векторы вопросов замера: ${qs.length}`)
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((e) => { console.error(e.message); process.exit(1) })
}
