#!/usr/bin/env node
/**
 * Загрузка картинок в кабинет Директа excel-to-app и привязка их к
 * объявлениям (issue #690).
 *
 * Картинки рисует `generate-direct-images.mjs`. Здесь:
 *   1. каждая PNG из site-excel/direct-images грузится в библиотеку
 *      (adimages.add) под именем `файл#md5-8`: перерисованная картинка
 *      загружается заново, неизменная — второй раз не грузится;
 *   2. каждому текстовому объявлению ставится картинка его посыла по адресу
 *      лендинга (/, /praktikum/, /adept/, /partner/). Внутри группы варианты
 *      чередуются (см. VARIANTS) — так у Директа есть что сравнить.
 *
 * Объявления, у которых нет картинки или стоит устаревшая версия своей,
 * обновляются; чужую картинку без --reassign не трогаем. Скрипт можно
 * перезапускать. Без --apply — только план.
 *
 * Грабля: id объявлений 19-значные, JSON.parse их округляет — Директ потом
 * отвечает «8800 объект не найден». Поэтому id держим строками, а тело
 * запроса собираем текстом.
 *
 *   DIRECT_TOKEN=… node scripts/direct-attach-images.mjs [--apply]
 */
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { postJson } from './lib/direct-api.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const imagesDir = resolve(__dirname, '../site-excel/direct-images')
const apply = process.argv.includes('--apply')
const token = process.env.DIRECT_TOKEN ?? ''
if (!token) {
  console.error('DIRECT_TOKEN не задан')
  process.exit(1)
}

/** Посыл по адресу лендинга. */
const CONCEPT_BY_PATH = { '/': 'excel', '/praktikum/': 'praktikum', '/adept/': 'adept', '/partner/': 'partner' }
/**
 * Два набора на посыл: свои макеты и макеты с иллюстрациями владельца (art).
 * Группы чередуют набор по чётности, и в каждой группе оба набора встречаются,
 * чтобы статистика Директа сравнивала их на одних фразах.
 */
const VARIANTS = [
  ['art-sq-a', 'sq-a', 'art-wide'],
  ['art-sq-b', 'sq-b', 'wide'],
]
const reassign = process.argv.includes('--reassign')

const ID_FIELDS = /"(Id|AdGroupId|CampaignId)":(\d+)/g

async function call(service, method, params) {
  // Id в теле передаём числом без округления: JSON.stringify строк + снятие кавычек.
  const body = JSON.stringify({ method, params }).replace(/"(Id|Ids|CampaignIds)":"(\d+)"/g, '"$1":$2')
  const { status, text } = await postJson(`https://api.direct.yandex.com/json/v5/${service}`, {
    headers: { Authorization: `Bearer ${token}`, 'Accept-Language': 'ru', 'Content-Type': 'application/json; charset=utf-8' },
    body,
  })
  if (status !== 200) throw new Error(`${service}.${method}: HTTP ${status} ${text.slice(0, 300)}`)
  const payload = JSON.parse(text.replace(ID_FIELDS, '"$1":"$2"'))
  if (payload.error) throw new Error(`${service}.${method}: ${payload.error.error_string} — ${payload.error.error_detail}`)
  return payload.result
}

/** Поштучные ошибки Директ кладёт внутрь ответа при HTTP 200 — без проверки отказ выглядит успехом. */
function check(results, what) {
  let failed = 0
  for (const item of results ?? []) {
    for (const w of item.Warnings ?? []) console.warn(`  ${what}: предупреждение ${w.Code} ${w.Message} ${w.Details ?? ''}`)
    for (const e of item.Errors ?? []) {
      failed++
      console.error(`  ${what}: ошибка ${e.Code} ${e.Message} ${e.Details ?? ''}`)
    }
  }
  return failed
}

// 1. Библиотека картинок.
const files = readdirSync(imagesDir).filter(f => f.endsWith('.png')).sort()
const existing = (await call('adimages', 'get', { SelectionCriteria: {}, FieldNames: ['AdImageHash', 'Name', 'Type'] })).AdImages ?? []
const libraryHash = Object.fromEntries(existing.map(i => [i.Name, i.AdImageHash]))
const libraryName = file => `${file}#${createHash('md5').update(readFileSync(resolve(imagesDir, file))).digest('hex').slice(0, 8)}`
const hashByName = {}
for (const f of files) if (libraryHash[libraryName(f)]) hashByName[f] = libraryHash[libraryName(f)]
const ownHashes = new Set(existing.filter(i => /\.png(#|$)/.test(i.Name)).map(i => i.AdImageHash))
const toUpload = files.filter(f => !hashByName[f])
console.log(`Картинок: ${files.length}, уже в кабинете: ${files.length - toUpload.length}, загрузить: ${toUpload.length}`)

if (apply) {
  for (const name of toUpload) {
    const res = await call('adimages', 'add', {
      AdImages: [{ ImageData: readFileSync(resolve(imagesDir, name)).toString('base64'), Name: libraryName(name) }],
    })
    const item = res.AddResults[0]
    if (check(res.AddResults, name)) process.exit(1)
    hashByName[name] = item.AdImageHash
    console.log(`  ✓ ${name} → ${item.AdImageHash}`)
  }
}

// 2. Объявления.
const campaigns = (await call('campaigns', 'get', { SelectionCriteria: {}, FieldNames: ['Id', 'Name'] })).Campaigns ?? []
const ads = []
for (let i = 0; i < campaigns.length; i += 10) {
  const CampaignIds = campaigns.slice(i, i + 10).map(c => c.Id)
  const res = await call('ads', 'get', {
    SelectionCriteria: { CampaignIds },
    FieldNames: ['Id', 'AdGroupId', 'CampaignId', 'Type'],
    TextAdFieldNames: ['AdImageHash', 'Href'],
  })
  ads.push(...(res.Ads ?? []))
}

const byId = (a, b) => (BigInt(a) < BigInt(b) ? -1 : 1)
const groupOrdinal = Object.fromEntries([...new Set(ads.map(a => a.AdGroupId))].sort(byId).map((g, i) => [g, i]))
const plan = []
const seenInGroup = {}
for (const ad of [...ads].sort((a, b) => byId(a.Id, b.Id))) {
  if (ad.Type !== 'TEXT_AD') continue
  const index = (seenInGroup[ad.AdGroupId] = (seenInGroup[ad.AdGroupId] ?? -1) + 1)
  const set = VARIANTS[groupOrdinal[ad.AdGroupId] % VARIANTS.length]
  const variant = set[index % set.length]
  const current = ad.TextAd.AdImageHash
  if (current && !ownHashes.has(current) && !reassign) continue
  const path = new URL(ad.TextAd.Href).pathname
  const concept = CONCEPT_BY_PATH[path]
  if (!concept) {
    console.warn(`  объявление ${ad.Id}: неизвестный лендинг ${path} — пропуск`)
    continue
  }
  const name = `${concept}-${variant}.png`
  if (current && current === hashByName[name]) continue
  plan.push({ Id: ad.Id, name })
}

const byName = {}
for (const p of plan) byName[p.name] = (byName[p.name] ?? 0) + 1
console.log(`Объявлений: ${ads.length}, поставить/заменить картинку: ${plan.length}`)
for (const [name, n] of Object.entries(byName).sort()) console.log(`  ${name}: ${n}`)

if (!apply) {
  console.log('\nСухой прогон. Для записи — --apply')
  process.exit(0)
}

let failed = 0
for (let i = 0; i < plan.length; i += 1000) {
  const Ads = plan.slice(i, i + 1000).map(p => ({ Id: p.Id, TextAd: { AdImageHash: hashByName[p.name] } }))
  const res = await call('ads', 'update', { Ads })
  failed += check(res.UpdateResults, 'ads.update')
}
console.log(failed ? `Готово с ошибками: ${failed}` : `✓ Картинки привязаны к ${plan.length} объявлениям`)
process.exit(failed ? 1 : 0)
