#!/usr/bin/env node
// Сверка: что лежит в группе Директа против того, что в keywords.json.
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const API = 'https://api.direct.yandex.com/json/v5'
const token = process.env.DIRECT_TOKEN ?? ''
const ids = (process.env.CAMPAIGN_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean)

function post(service, body) {
  const args = ['-sS', '-m', '180', '-X', 'POST', `${API}/${service}`,
    '-H', `Authorization: Bearer ${token}`, '-H', 'Accept-Language: ru',
    '-H', 'Content-Type: application/json; charset=utf-8', '--data-binary', '@-']
  const r = spawnSync('curl', args, { input: body, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  if (r.error || r.status !== 0) throw new Error('curl не смог выполнить запрос')
  return r.stdout
}

const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../docs/marketing/excel-cpa-campaign.keywords.json')
const { groups } = JSON.parse(readFileSync(file, 'utf8'))
const byName = new Map(groups.map(g => [g.name, new Set(g.keywords)]))

for (const campaignId of ids) {
  const groupsText = post('adgroups', JSON.stringify({
    method: 'get', params: { SelectionCriteria: { CampaignIds: [Number(campaignId)] }, FieldNames: ['Id', 'Name'] },
  }))
  const pairs = [...groupsText.matchAll(/"Id":(\d+),"Name":"((?:[^"\\]|\\.)*)"/g)].map(([, id, name]) => ({ id, name: JSON.parse(`"${name}"`) }))
  console.log(`\nКампания ${campaignId}`)
  for (const { id, name } of pairs) {
    const text = post('keywords', JSON.stringify({
      method: 'get', params: { SelectionCriteria: { AdGroupIds: [Number(id)] }, FieldNames: ['Id', 'Keyword'] },
    }))
    const live = [...text.matchAll(/"Keyword":"((?:[^"\\]|\\.)*)"/g)].map(([, k]) => JSON.parse(`"${k}"`))
    const want = byName.get(name)
    if (!want) { console.log(`  «${name}» (${id}): ${live.length} фраз, группы нет в ядре`); continue }
    const missing = [...want].filter(k => !live.includes(k))
    const extra = live.filter(k => !want.has(k))
    console.log(`  «${name}» (${id}): в кабинете ${live.length}, в файле ${want.size}`)
    if (missing.length) console.log(`    не доехало (${missing.length}): ${missing.join(' | ')}`)
    if (extra.length) console.log(`    лишнее (${extra.length}): ${extra.join(' | ')}`)
  }
}
