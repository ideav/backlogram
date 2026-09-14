#!/usr/bin/env node
/**
 * Белый список площадок РСЯ, собранный чёрным списком.
 *
 * В Директе нельзя сказать «показывайся только на этих сайтах»: у кампании есть
 * только список ЗАПРЕЩЁННЫХ площадок (до 1000 доменов). Поэтому белый список
 * ведётся наоборот — скрипт берёт отчёт по площадкам, выбрасывает всё, чего нет
 * в docs/marketing/rsya-whitelist.json, и дописывает это в запрет кампании.
 *
 * Отсюда регламент: запускать регулярно. Каждая новая площадка вне списка
 * успевает открутить какое-то количество показов до следующего запуска — это
 * неизбежная плата за то, что белого списка в Директе нет.
 *
 *   node scripts/direct-rsya-whitelist-sync.mjs --campaigns 123,456
 *   node scripts/direct-rsya-whitelist-sync.mjs --campaigns 123 --apply
 *   node scripts/direct-rsya-whitelist-sync.mjs --campaigns 123 --write-list
 *
 *   --days N       период отчёта, по умолчанию 30
 *   --apply        записать запрет в кампанию (без него — только показать)
 *   --write-list   сохранить накопленный запрет в docs/marketing/rsya-excluded-sites.json
 *
 * Окружение: DIRECT_TOKEN — OAuth-токен Директа.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

import { call as apiCall, report } from './lib/direct-api.mjs'

/** Ограничение Директа на список запрещённых площадок кампании. */
export const EXCLUDED_SITES_LIMIT = 1000

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WHITELIST_FILE = path.resolve(__dirname, '../docs/marketing/rsya-whitelist.json')
const EXCLUDED_FILE = path.resolve(__dirname, '../docs/marketing/rsya-excluded-sites.json')

/** `www.RBC.ru/…` → `rbc.ru`; идентификатор приложения остаётся как есть. */
export function normalizePlacement(raw) {
  const value = String(raw ?? '').trim().toLowerCase()
  if (value === '') return ''
  return value.replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '')
}

/** Разрешена ли площадка: сам домен из списка или его поддомен. */
export function isAllowed(placement, allow) {
  const site = normalizePlacement(placement)
  return allow.some(domain => site === domain || site.endsWith(`.${domain}`))
}

/**
 * Что дописать в запрет кампании.
 *
 * Лимит в 1000 доменов рано или поздно упрётся (в аккаунте уже 990 площадок за
 * два месяца), поэтому при переполнении режем не как попало: оставляем те, что
 * стоили дороже — они и есть настоящая утечка бюджета.
 */
export function planExclusions({ seen, current, allow, limit = EXCLUDED_SITES_LIMIT }) {
  const already = new Set(current.map(normalizePlacement))
  const candidates = seen
    .filter(row => !isAllowed(row.placement, allow))
    .map(row => ({ ...row, placement: normalizePlacement(row.placement) }))
    .filter(row => row.placement !== '' && !already.has(row.placement))

  // Дубли внутри отчёта складываем, чтобы приоритет считался по сумме.
  const merged = new Map()
  for (const row of candidates) {
    const previous = merged.get(row.placement) ?? { placement: row.placement, clicks: 0, cost: 0 }
    merged.set(row.placement, {
      placement: row.placement,
      clicks: previous.clicks + row.clicks,
      cost: previous.cost + row.cost,
    })
  }

  const ranked = [...merged.values()].sort((a, b) => b.cost - a.cost || b.clicks - a.clicks)
  const room = Math.max(0, limit - already.size)
  return {
    added: ranked.slice(0, room),
    skipped: ranked.slice(room),
    total: already.size + Math.min(room, ranked.length),
  }
}

// ── Дальше — работа с API ────────────────────────────────────────────────────

const argv = process.argv.slice(2)
const apply = argv.includes('--apply')
const writeList = argv.includes('--write-list')
const days = Number(valueOf('--days') ?? 30)
const campaignIds = (valueOf('--campaigns') ?? '')
  .split(',')
  .map(id => id.trim())
  .filter(Boolean)

function valueOf(flag) {
  const index = argv.indexOf(flag)
  return index === -1 ? undefined : argv[index + 1]
}

const token = process.env.DIRECT_TOKEN ?? ''

const call = (service, method, params) => apiCall(service, method, params, token)

/** Отчёт по площадкам за период. */
async function placementsReport() {
  const to = new Date()
  const from = new Date(to.getTime() - days * 86_400_000)
  const tsv = await report(
    {
      SelectionCriteria: {
        DateFrom: from.toISOString().slice(0, 10),
        DateTo: to.toISOString().slice(0, 10),
        Filter: [{ Field: 'CampaignId', Operator: 'IN', Values: campaignIds }],
      },
      FieldNames: ['Placement', 'Impressions', 'Clicks', 'Cost'],
      ReportName: `rsya-placements-${Date.now()}`,
      ReportType: 'CUSTOM_REPORT',
      DateRangeType: 'CUSTOM_DATE',
      Format: 'TSV',
      IncludeVAT: 'YES',
      IncludeDiscount: 'NO',
    },
    token,
  )

  const [, ...rows] = tsv.trim().split('\n')
  return rows
    .map(line => line.split('\t'))
    .map(([placement, impressions, clicks, cost]) => ({
      placement,
      impressions: Number(impressions) || 0,
      clicks: Number(clicks) || 0,
      cost: Number(cost) || 0,
    }))
}

async function main() {
  if (!token) throw new Error('DIRECT_TOKEN не задан')
  if (campaignIds.length === 0) throw new Error('нужен --campaigns со списком id кампаний')

  const { allow } = JSON.parse(readFileSync(WHITELIST_FILE, 'utf8'))
  console.log(`Белый список: ${allow.length} доменов. Кампании: ${campaignIds.join(', ')}. Период: ${days} дн.`)

  const seen = await placementsReport()
  console.log(`Площадок в отчёте: ${seen.length}`)

  // ExcludedSites — поле самой кампании, не TextCampaign: в TextCampaignFieldNames
  // его нет, API отвечает на такой запрос ошибкой перечисления.
  const campaigns = await call('campaigns', 'get', {
    SelectionCriteria: { Ids: campaignIds.map(Number) },
    FieldNames: ['Id', 'Name', 'ExcludedSites'],
  })

  for (const campaign of campaigns.Campaigns ?? []) {
    const current = campaign.ExcludedSites?.Items ?? []
    const { added, skipped, total } = planExclusions({ seen, current, allow })

    console.log(`\n=== ${campaign.Name} (${campaign.Id}) ===`)
    console.log(`уже запрещено: ${current.length}, добавляется: ${added.length}, итого: ${total}`)
    for (const row of added.slice(0, 15)) {
      console.log(`  ${String(row.clicks).padStart(4)} кликов  ${row.cost.toFixed(2).padStart(8)} ₽  ${row.placement}`)
    }
    if (added.length > 15) console.log(`  … и ещё ${added.length - 15}`)
    if (skipped.length) {
      console.warn(`  ВНИМАНИЕ: лимит ${EXCLUDED_SITES_LIMIT} исчерпан, не влезло ${skipped.length} площадок.`)
      console.warn('  Дальше белый список этой кампанией не держится — нужна новая кампания или другой инструмент.')
    }

    const next = [...current, ...added.map(row => row.placement)]
    if (writeList) {
      writeFileSync(EXCLUDED_FILE, JSON.stringify({ campaignId: campaign.Id, excluded: next }, null, 2) + '\n')
      console.log(`  список сохранён: ${path.relative(process.cwd(), EXCLUDED_FILE)}`)
    }
    if (apply && added.length) {
      await call('campaigns', 'update', {
        Campaigns: [{ Id: campaign.Id, ExcludedSites: { Items: next } }],
      })
      console.log('  запрет записан в кампанию')
    }
  }

  if (!apply) console.log('\nЭто был показ без изменений. Повторите с --apply, чтобы записать запрет.')
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error('\n' + error.message)
    process.exit(1)
  })
}
