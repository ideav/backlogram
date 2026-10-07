#!/usr/bin/env node
/**
 * Перестраивает уже созданные кампании практикума (issue #670): вместо двух
 * групп фраз по 3 объявления — четыре группы по ролям, у каждой кампании в
 * каждой группе своя тройка объявлений из praktikum-cpa.ads.json. Итого 48
 * разных объявлений на 4 кампании.
 *
 * Порядок безопасный: сначала создаются новые группы с фразами и объявлениями,
 * потом удаляются старые. Повторный запуск не плодит дубли — группа с тем же
 * именем пропускается. Объявления остаются черновиками, кампании не трогаются.
 *
 *   DIRECT_TOKEN=… SITE_URL=https://excel-to-app.ru node scripts/direct-praktikum-regroup.mjs           # сухой прогон
 *   DIRECT_TOKEN=… SITE_URL=https://excel-to-app.ru node scripts/direct-praktikum-regroup.mjs --apply   # применить
 */

import { fileURLToPath } from 'node:url'
import path from 'node:path'

import { call as apiCall, postJson } from './lib/direct-api.mjs'
import { EXACT_ONLY, PROFILES, adsFor, campaignsFor, groupsFor } from './direct-create-cpa-campaign.mjs'

const P = PROFILES.praktikum
const REGION_RUSSIA = 225
const apply = process.argv.includes('--apply')
const token = process.env.DIRECT_TOKEN ?? ''
const siteUrl = (process.env.SITE_URL ?? '').replace(/\/+$/, '')

/** Кампании практикума в кабинете excel-to-app (созданы 07.10.2026, issue #668). */
export const CAMPAIGN_IDS = [715160781, 715160822, 715160860, 715160897]

const call = (service, method, params) => apiCall(service, method, params, token)

/**
 * id объявлений группы. Они 19-значные, и JSON.parse их молча округляет, —
 * поэтому достаются из текста ответа, а запрос на удаление собирается текстом.
 */
async function adIdsOf(groupIds) {
  const { text } = await postJson('https://api.direct.yandex.com/json/v5/ads', {
    headers: { Authorization: `Bearer ${token}`, 'Accept-Language': 'ru', 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ method: 'get', params: { SelectionCriteria: { AdGroupIds: groupIds }, FieldNames: ['Id'] } }),
  })
  return [...text.matchAll(/"Id":(\d+)/g)].map(m => m[1])
}

async function deleteAds(ids) {
  if (!ids.length) return []
  const { text } = await postJson('https://api.direct.yandex.com/json/v5/ads', {
    headers: { Authorization: `Bearer ${token}`, 'Accept-Language': 'ru', 'Content-Type': 'application/json; charset=utf-8' },
    body: `{"method":"delete","params":{"SelectionCriteria":{"Ids":[${ids.join(',')}]}}}`,
  })
  return idsOf(JSON.parse(text).result, 'DeleteResults')
}

/** Записи ответа с ошибками — печатает их; возвращает id успешных. */
function idsOf(result, key) {
  const items = result?.[key] ?? []
  for (const item of items) {
    for (const warning of item.Warnings ?? []) console.warn('  предупреждение:', warning.Message)
    for (const error of item.Errors ?? []) console.error('  ошибка:', error.Message, error.Details ?? '')
  }
  return items.map(item => item.Id).filter(Boolean)
}

async function main() {
  if (!token || !siteUrl.startsWith('https://')) {
    console.error('Нужны DIRECT_TOKEN и SITE_URL (https).')
    process.exit(1)
  }
  console.log(apply ? 'Перестраиваю группы в боевом кабинете.' : 'Сухой прогон: читаю кабинет, ничего не меняю.')

  const groups = groupsFor(P)
  const plan = campaignsFor(P)
  const { Campaigns: found = [] } = await call('campaigns', 'get', {
    SelectionCriteria: { Ids: CAMPAIGN_IDS },
    FieldNames: ['Id', 'Name', 'State'],
  })

  for (const campaign of found) {
    const index = plan.findIndex(c => c.Name === campaign.Name)
    if (index < 0) throw new Error(`кампания ${campaign.Id} «${campaign.Name}» не из профиля практикума`)
    const slug = plan[index]._slug
    const network = slug.includes('-network-')
    console.log(`\n=== ${campaign.Name} (${campaign.Id}, ${campaign.State}) ===`)

    const { AdGroups: oldGroups = [] } = await call('adgroups', 'get', {
      SelectionCriteria: { CampaignIds: [campaign.Id] },
      FieldNames: ['Id', 'Name'],
    })
    // Быстрые ссылки и уточнения — те же, что у объявлений кампании сейчас.
    const { Ads: oldAds = [] } = await call('ads', 'get', {
      SelectionCriteria: { CampaignIds: [campaign.Id] },
      FieldNames: ['AdGroupId'],
      TextAdFieldNames: ['SitelinkSetId', 'AdExtensions'],
    })
    const sample = oldAds.find(ad => ad.TextAd?.SitelinkSetId)
    if (!sample) throw new Error('не нашёл объявления с быстрыми ссылками — не из чего взять их набор')
    const sitelinkSetId = sample.TextAd.SitelinkSetId
    const calloutIds = (sample.TextAd.AdExtensions ?? []).map(e => e.AdExtensionId)

    const newNames = new Set(groups.map(g => g.name))
    const stale = oldGroups.filter(g => !newNames.has(g.Name))
    const created = []

    for (const group of groups) {
      const ads = adsFor(slug, siteUrl, P, group, index)
      if (oldGroups.some(g => g.Name === group.name)) {
        console.log(`  группа «${group.name}» уже есть — пропускаю`)
        continue
      }
      console.log(`  группа «${group.name}»: ${group.keywords.length} фраз, объявления:`)
      for (const ad of ads) console.log(`    · ${ad.Title} — ${ad.Text}`)
      if (!apply) continue

      const [groupId] = idsOf(await call('adgroups', 'add', {
        AdGroups: [{ Name: group.name, CampaignId: campaign.Id, RegionIds: [REGION_RUSSIA] }],
      }), 'AddResults')
      if (!groupId) throw new Error(`группа «${group.name}» не создана — см. ошибку выше`)
      created.push(groupId)
      const keywordIds = idsOf(await call('keywords', 'add', {
        Keywords: group.keywords.map(Keyword => ({ Keyword, AdGroupId: groupId })),
      }), 'AddResults')
      const adIds = idsOf(await call('ads', 'add', {
        Ads: ads.map(ad => ({
          AdGroupId: groupId,
          TextAd: { ...ad, SitelinkSetId: sitelinkSetId, AdExtensionIds: calloutIds },
        })),
      }), 'AddResults')
      console.log(`    создана ${groupId}: фраз ${keywordIds.length}/${group.keywords.length}, объявлений ${adIds.length}/${ads.length}`)
      if (adIds.length !== ads.length) throw new Error('не все объявления созданы — старые группы не удаляю')
    }

    // Автотаргетинг новых групп — как при создании кампаний: в сетях включён,
    // на поиске сужен до целевых запросов (остановить его там Директ не даёт).
    if (apply && created.length) {
      const { Keywords: auto = [] } = await call('keywords', 'get', {
        SelectionCriteria: { AdGroupIds: created },
        FieldNames: ['Id', 'Keyword'],
      })
      const autoIds = auto.filter(k => k.Keyword.startsWith('---autotargeting')).map(k => k.Id)
      if (autoIds.length && network) {
        idsOf(await call('keywords', 'resume', { SelectionCriteria: { Ids: autoIds } }), 'ResumeResults')
      } else if (autoIds.length) {
        idsOf(await call('keywords', 'update', {
          Keywords: autoIds.map(Id => ({ Id, AutotargetingCategories: EXACT_ONLY })),
        }), 'UpdateResults')
      }
      console.log(`  автотаргетинг: ${network ? 'включён' : 'только целевые запросы'} (${autoIds.length} групп)`)
    }

    if (stale.length) {
      console.log(`  старые группы к удалению: ${stale.map(g => `${g.Id} «${g.Name}»`).join(', ')}`)
      if (apply) {
        // Группу с объявлениями или фразами Директ не удаляет — сначала их.
        const staleIds = stale.map(g => g.Id)
        const adsGone = await deleteAds(await adIdsOf(staleIds))
        const { Keywords: kws = [] } = await call('keywords', 'get', {
          SelectionCriteria: { AdGroupIds: staleIds },
          FieldNames: ['Id', 'Keyword'],
        })
        const kwIds = kws.filter(k => !k.Keyword.startsWith('---autotargeting')).map(k => k.Id)
        const kwGone = kwIds.length
          ? idsOf(await call('keywords', 'delete', { SelectionCriteria: { Ids: kwIds } }), 'DeleteResults')
          : []
        console.log(`  из старых групп удалено объявлений ${adsGone.length}, фраз ${kwGone.length}/${kwIds.length}`)
        const deleted = idsOf(await call('adgroups', 'delete', { SelectionCriteria: { Ids: stale.map(g => g.Id) } }), 'DeleteResults')
        console.log(`  удалено: ${deleted.length}/${stale.length}`)
      }
    }
  }

  console.log(apply ? '\nГотово. Объявления — черновики, кампании в прежнем состоянии.' : '\nСухой прогон закончен. Повторите с --apply.')
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error('\n' + error.message)
    process.exit(1)
  })
}
