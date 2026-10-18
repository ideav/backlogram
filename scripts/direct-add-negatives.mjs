/**
 * Дописывает минус-слова из docs/marketing/excel-cpa-negatives.json в уже
 * работающие кампании — только добавляет, ничего не снимает.
 *
 * Почему не excel-cpa-sync-keywords.mjs: тот сносит и перезаливает фразы групп,
 * а у живых кампаний есть правки мимо файла — «бесплатно», «xls», «!не
 * открывается» (09.10.2026) и приостановленные фразы с «бесплатн…». Здесь
 * минус-слова кампании = то, что стоит сейчас, плюс недостающее из файла (#763).
 *
 *   node scripts/direct-add-negatives.mjs            # сухой прогон: что добавится
 *   node scripts/direct-add-negatives.mjs --apply    # отправить
 *
 * Окружение:
 *   DIRECT_TOKEN   OAuth-токен кабинета excel-to-app (обязателен)
 *   CAMPAIGN_IDS   кампании через запятую (по умолчанию — поиск Excel-CPA и A/B-копии)
 */

import { fileURLToPath } from 'node:url'

import { call } from './lib/direct-api.mjs'
import { loadNegatives } from './excel-cpa-import-core.mjs'

/** Поиск Excel-CPA день/ночь и копии «· ключ в заголовке» — работают с 18.10.2026. */
const DEFAULT_IDS = ['714908020', '714908370', '715154305', '715154363']

// Директ ограничивает минус-фразы кампании 20 000 символами вместе с пробелами.
const MAX_CHARS = 20000

/** Живые минус-слова плюс недостающие: порядок живых не трогаем, новые — в конец. */
export function mergeNegatives(live, wanted) {
  const have = new Set(live.map(w => w.toLowerCase()))
  const added = wanted.filter(w => !have.has(w.toLowerCase()))
  const items = [...live, ...added]
  return { items, added, chars: items.join(' ').length }
}

async function main() {
  const apply = process.argv.includes('--apply')
  const token = process.env.DIRECT_TOKEN ?? ''
  if (!token) {
    console.error('DIRECT_TOKEN: нужен токен кабинета excel-to-app (и для сухого прогона — он читает кабинет).')
    process.exit(1)
  }
  const ids = (process.env.CAMPAIGN_IDS ?? DEFAULT_IDS.join(',')).split(',').map(s => s.trim()).filter(Boolean)
  const wanted = loadNegatives()

  const { Campaigns = [] } = await call('campaigns', 'get', {
    SelectionCriteria: { Ids: ids },
    FieldNames: ['Id', 'Name', 'State', 'NegativeKeywords'],
  }, token)

  console.log(apply ? 'Дописываю минус-слова.' : 'Сухой прогон: ничего не отправляю.')
  const updates = []
  for (const campaign of Campaigns) {
    const { items, added, chars } = mergeNegatives(campaign.NegativeKeywords?.Items ?? [], wanted)
    if (!added.length) {
      console.log(`  ${campaign.Name} (${campaign.Id}): всё уже стоит`)
      continue
    }
    if (chars > MAX_CHARS) {
      console.error(`  ${campaign.Name} (${campaign.Id}): ${chars} символов — больше лимита Директа ${MAX_CHARS}`)
      process.exit(1)
    }
    console.log(`  ${campaign.Name} (${campaign.Id}, ${campaign.State}): +${added.length} — ${added.join(', ')}`)
    updates.push({ Id: campaign.Id, NegativeKeywords: { Items: items } })
  }
  if (!apply || !updates.length) return

  const result = await call('campaigns', 'update', { Campaigns: updates }, token)
  let failed = false
  for (const item of result.UpdateResults ?? []) {
    for (const warning of item.Warnings ?? []) console.warn(`  ${item.Id}: предупреждение: ${warning.Message} ${warning.Details ?? ''}`)
    // Пустой Errors: [] — не ошибка.
    for (const error of item.Errors ?? []) {
      failed = true
      console.error(`  ${item.Id ?? ''} ошибка: ${error.Message} ${error.Details ?? ''}`)
    }
  }
  if (failed) process.exit(1)
  console.log(`Готово: обновлено кампаний ${updates.length}.`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(error.message)
    process.exit(1)
  })
}
