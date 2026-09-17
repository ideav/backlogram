#!/usr/bin/env node
/**
 * Приводит ключевые фразы уже созданных кампаний «Excel → приложение» к тому,
 * что лежит в docs/marketing/excel-cpa-campaign.keywords.json.
 *
 * Зачем отдельно от direct-create-cpa-campaign.mjs: тот создаёт кампании с нуля
 * и кампанию с занятым именем пропускает целиком. Когда ядро пересобрано, а
 * кампании уже есть, нужна именно синхронизация — иначе пришлось бы удалять
 * кампании и терять их историю и id.
 *
 * Что делает:
 *   1. группы, которых нет в ядре (например выброшенный «Офисный мусор»), удаляет;
 *   2. в оставшихся сносит все фразы и заливает новые — так группа гарантированно
 *      совпадает с файлом, а не копит хвосты от прошлых заливок;
 *   3. обновляет минус-слова группы.
 *
 * Без --apply ничего не меняет, только показывает план.
 *
 *   node scripts/excel-cpa-sync-keywords.mjs            # план
 *   node scripts/excel-cpa-sync-keywords.mjs --apply    # залить
 *
 * Окружение: DIRECT_TOKEN, CAMPAIGN_IDS (через запятую).
 *
 * ВАЖНО про числа: id объявлений и групп в Директе давно вылезли за пределы
 * точности double, и JSON.parse их молча округляет — «1921510934857993011»
 * превращается в «1921510934857993000». Поэтому id вынимаются из сырого текста
 * ответа регуляркой и дальше живут строками.
 */

import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const API = 'https://api.direct.yandex.com/json/v5'
const CHUNK = 200

const apply = process.argv.includes('--apply')
const token = process.env.DIRECT_TOKEN ?? ''
const campaignIds = (process.env.CAMPAIGN_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean)

const KEYWORDS_FILE = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../docs/marketing/excel-cpa-campaign.keywords.json',
)

/** Сырой POST к API. Возвращает текст: разбирать будем сами, без потери id. */
function post(service, body) {
  const args = [
    '-sS', '-m', '180', '-X', 'POST', `${API}/${service}`,
    '-H', `Authorization: Bearer ${token}`,
    '-H', 'Accept-Language: ru',
    '-H', 'Content-Type: application/json; charset=utf-8',
    '--data-binary', '@-',
  ]
  const result = spawnSync('curl', args, { input: body, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  if (result.error || result.status !== 0) throw new Error('curl не смог выполнить запрос')
  return result.stdout
}

/**
 * Поштучные ошибки в ответах Директа. Ловить их обязательно: API отвечает
 * HTTP 200 и общим `result`, а отказ по конкретному объекту лежит внутри, в
 * `Errors`. Без этой проверки «Нельзя удалить группу, содержащую объявления»
 * выглядит как успешное удаление — ровно так мусорные группы и пережили
 * первую заливку.
 */
export function itemErrors(text) {
  return [...text.matchAll(/"Errors":\[\{"Code":(\d+),"Message":"((?:[^"\\]|\\.)*)","Details":"((?:[^"\\]|\\.)*)"/g)]
    .map(([, code, message, details]) => `${code} ${JSON.parse(`"${message}"`)}: ${JSON.parse(`"${details}"`)}`)
}

function call(service, method, params, { tolerate = [] } = {}) {
  const text = post(service, JSON.stringify({ method, params }))
  const error = text.match(/"error_string":"([^"]*)","error_detail":"([^"]*)"/)
  if (error) throw new Error(`${service}.${method}: ${error[1]} — ${error[2]}`)
  const problems = itemErrors(text).filter(p => !tolerate.some(code => p.startsWith(String(code))))
  if (problems.length) {
    const unique = [...new Set(problems)]
    throw new Error(`${service}.${method}: ${unique.slice(0, 3).join(' | ')}${unique.length > 3 ? ` (и ещё ${unique.length - 3})` : ''}`)
  }
  return text
}

/**
 * Удаление по списку id БЕЗ прохода через Number. Id объявлений в Директе
 * 19-значные, а Number() округляет их молча: 1921542229064130327 превращается
 * в ...300, Директ такого объекта не находит и отвечает «8800 Объявление не
 * найдено» — выглядит как «уже удалено», хотя объявление живо. Поэтому тело
 * запроса собирается текстом, а id остаются строками.
 */
function deleteByIds(service, ids, opts) {
  const body = `{"method":"delete","params":{"SelectionCriteria":{"Ids":[${ids.join(',')}]}}}`
  return callRaw(service, body, opts)
}

function callRaw(service, body, { tolerate = [] } = {}) {
  const text = post(service, body)
  const error = text.match(/"error_string":"([^"]*)","error_detail":"([^"]*)"/)
  if (error) throw new Error(`${service}: ${error[1]} — ${error[2]}`)
  const problems = itemErrors(text).filter(p => !tolerate.some(code => p.startsWith(String(code))))
  if (problems.length) {
    const unique = [...new Set(problems)]
    throw new Error(`${service}.delete: ${unique.slice(0, 3).join(' | ')}`)
  }
  return text
}

/** Пары (Id, Name) из сырого ответа: id строкой, чтобы не потерять точность. */
export function parseIdName(text) {
  return [...text.matchAll(/"Id":(\d+),"Name":"((?:[^"\\]|\\.)*)"/g)]
    .map(([, id, name]) => ({ id, name: JSON.parse(`"${name}"`) }))
}

/** Только идентификаторы — для фраз, где имени нет. */
export function parseIds(text) {
  return [...text.matchAll(/"Id":(\d+)/g)].map(([, id]) => id)
}

/**
 * Идентификаторы настоящих фраз — без `---autotargeting`. Автотаргетинг Директ
 * заводит в группе сам; сносить его нельзя, это отдельный источник показов, а
 * при оплате за конверсии показы и есть то, чего не хватает.
 */
export function parseKeywordIds(text) {
  return [...text.matchAll(/"Keyword":"((?:[^"\\]|\\.)*)","Id":(\d+)|"Id":(\d+),"Keyword":"((?:[^"\\]|\\.)*)"/g)]
    .map(match => (match[1] !== undefined
      ? { keyword: JSON.parse(`"${match[1]}"`), id: match[2] }
      : { keyword: JSON.parse(`"${match[4]}"`), id: match[3] }))
    .filter(({ keyword }) => !keyword.startsWith('---'))
    .map(({ id }) => id)
}

/** Разбить на куски: Директ не любит огромные пачки в одном запросе. */
export function chunked(items, size = CHUNK) {
  const out = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

function main() {
  if (!token) { console.error('DIRECT_TOKEN не задан'); process.exit(1) }
  if (!campaignIds.length) { console.error('CAMPAIGN_IDS не заданы'); process.exit(1) }

  const { groups } = JSON.parse(readFileSync(KEYWORDS_FILE, 'utf8'))
  const byName = new Map(groups.map(group => [group.name, group]))
  console.log(`Ядро: ${groups.map(g => `${g.name} — ${g.keywords.length}`).join(', ')}\n`)

  for (const campaignId of campaignIds) {
    console.log(`Кампания ${campaignId}`)
    const groupsText = call('adgroups', 'get', {
      SelectionCriteria: { CampaignIds: [Number(campaignId)] },
      FieldNames: ['Id', 'Name'],
    })
    const existing = parseIdName(groupsText)

    for (const { id, name } of existing) {
      const wanted = byName.get(name)

      if (!wanted) {
        // Пустую группу Директ удаляет, непустую — нет: «Нельзя удалить группу,
        // содержащую объявления или условия показа». Поэтому сначала фразы,
        // потом объявления, и только затем сама группа.
        console.log(`  группа «${name}» (${id}) — нет в ядре, удаляю`)
        if (!apply) continue
        // Здесь берём ВСЁ, включая ---autotargeting: он тоже «условие показа»,
        // и пока он жив, Директ группу удалить не даст.
        const keywordIds = parseIds(call('keywords', 'get', {
          SelectionCriteria: { AdGroupIds: [Number(id)] }, FieldNames: ['Id'],
        }))
        for (const part of chunked(keywordIds)) {
          // 8800 «объект не найден» здесь не беда: если прошлый прогон
          // оборвался посередине, часть уже удалена — это и есть нужный итог.
          // 5005 — отказ удалить ---autotargeting: Директ заводит его сам и через
          // keywords.delete не отдаёт. 8800 — объект уже удалён прошлым прогоном.
          deleteByIds('keywords', part, { tolerate: [8800, 5005] })
        }
        const adIds = parseIds(call('ads', 'get', {
          SelectionCriteria: { AdGroupIds: [Number(id)] }, FieldNames: ['Id'],
        }))
        for (const part of chunked(adIds)) {
          deleteByIds('ads', part, { tolerate: [8800] })
        }
        // Группу с живым автотаргетингом Директ удалить не даст (8301). Это не
        // беда: без объявлений группа не покажет ничего, а руками её можно
        // добить в интерфейсе.
        const dropped = call('adgroups', 'delete', { SelectionCriteria: { Ids: [Number(id)] } }, { tolerate: [8800, 8301] })
        const leftAlive = itemErrors(dropped).some(p => p.startsWith('8301'))
        console.log(`    объявлений удалено ${adIds.length}; группа ${leftAlive ? 'осталась пустой (мешает автотаргетинг)' : 'удалена'}`)
        continue
      }

      const current = parseKeywordIds(call('keywords', 'get', {
        SelectionCriteria: { AdGroupIds: [Number(id)] },
        FieldNames: ['Id', 'Keyword'],
      }))
      console.log(`  группа «${name}» (${id}): было ${current.length} фраз, станет ${wanted.keywords.length}`)
      if (!apply) continue

      for (const part of chunked(current)) {
        deleteByIds('keywords', part)
      }
      for (const part of chunked(wanted.keywords)) {
        call('keywords', 'add', {
          Keywords: part.map(Keyword => ({ Keyword, AdGroupId: Number(id) })),
        })
      }
      call('adgroups', 'update', {
        AdGroups: [{
          Id: Number(id),
          NegativeKeywords: { Items: wanted.minusWords },
        }],
      })
      console.log('    залито')
    }

    for (const group of groups) {
      if (!existing.some(g => g.name === group.name)) {
        console.log(`  ВНИМАНИЕ: группы «${group.name}» в кампании нет — создайте её direct-create-cpa-campaign.mjs`)
      }
    }
  }

  if (!apply) console.log('\nСухой прогон. Повторите с --apply, чтобы залить.')
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main() } catch (error) { console.error('\n' + error.message); process.exit(1) }
}
