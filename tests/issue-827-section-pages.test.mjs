// issue #827 — «цель была сделать полноценные страницы, а не обрубки»: на
// главной остаются только общие вещи (в разы короче), а страница каждого
// раздела — подробное описание своей темы. Содержание блоков главной
// (кейсы, схема работы, команда, отрасли, интеграции, цены, облачные тарифы)
// переехало в разделы; их старые якоря главной переадресуются туда же.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, cpSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { SITE_SECTIONS, CLOUD_PLANS } from '../src/data/siteSections.mjs'
import { SERVICES, formatPrice } from '../src/data/services.mjs'
import { HOME_CASE_SCREENSHOTS } from '../src/data/home-cases.mjs'

const repo = fileURLToPath(new URL('..', import.meta.url))
const read = (p) => readFileSync(resolve(repo, p), 'utf8')
const home = read('src/pages/Home.tsx')

function prerender() {
  const work = mkdtempSync(resolve(tmpdir(), 'issue-827-'))
  mkdirSync(resolve(work, 'dist'), { recursive: true })
  mkdirSync(resolve(work, 'scripts'), { recursive: true })
  cpSync(resolve(repo, 'scripts/prerender-site-sections.mjs'), resolve(work, 'scripts/prerender-site-sections.mjs'))
  cpSync(resolve(repo, 'src/data'), resolve(work, 'src/data'), { recursive: true })
  writeFileSync(resolve(work, 'dist/index.html'), read('index.html'))
  execFileSync('node', ['scripts/prerender-site-sections.mjs'], { cwd: work })
  return Object.fromEntries(SITE_SECTIONS.map((s) => [s.slug, readFileSync(resolve(work, `dist/${s.slug}.html`), 'utf8')]))
}
const out = prerender()

test('главная — только общее: выбор раздела, коротко о платформе, клиенты, форма, FAQ, блог', () => {
  const ids = [...home.matchAll(/<section id="([^"]+)"/g)].map((m) => m[1])
  assert.deepEqual(ids, ['hero', 'technology', 'cta', 'faq', 'about'])
  // Было 1731 строка — «сократить в несколько раз».
  assert.ok(home.split('\n').length < 450, `Home.tsx: ${home.split('\n').length} строк`)
  for (const gone of ['cases', 'pricing', 'cloud-tariffs', 'process', 'team', 'for-whom', 'project-types', 'solutions', 'integration', 'ai']) {
    assert.doesNotMatch(home, new RegExp(`<section id="${gone}"`), `#${gone} должен жить в разделе`)
  }
})

test('страница раздела — полноценная: свои блоки по теме, не только ссылки', () => {
  for (const s of SITE_SECTIONS) {
    const content = s.blocks.filter((b) => b.type !== 'links')
    assert.ok(content.length >= 5, `${s.slug}: ${content.length} содержательных блоков`)
    assert.ok(s.faq.length >= 4, `${s.slug}: ${s.faq.length} вопросов FAQ`)
    assert.equal(new Set(s.blocks.map((b) => b.id)).size, s.blocks.length, `${s.slug}: id блоков повторяются`)
    assert.ok(s.blocks.some((b) => b.type === 'pricing'), `${s.slug}: нет блока цен`)
  }
})

test('сырой HTML раздела несёт всё содержание блоков', () => {
  for (const s of SITE_SECTIONS) {
    const html = out[s.slug]
    for (const b of s.blocks) {
      assert.ok(html.includes(`<section id="${b.id}">`), `${s.slug}: нет блока #${b.id}`)
      for (const it of b.items ?? []) assert.ok(html.includes(it.title), `${s.slug}: нет пункта «${it.title}»`)
      for (const st of b.steps ?? []) assert.ok(html.includes(st.title), `${s.slug}: нет шага «${st.title}»`)
    }
    for (const f of s.faq) assert.ok(html.includes(f.q), `${s.slug}: нет вопроса «${f.q}»`)
  }
})

test('кейсы со скриншотами — в разделе «Автоматизация бизнеса», с alt из общего источника', () => {
  const auto = SITE_SECTIONS.find((s) => s.slug === 'avtomatizaciya-biznesa')
  const cases = auto.blocks.find((b) => b.type === 'cases')
  assert.equal(cases.id, 'cases')
  assert.deepEqual(cases.cases.map((c) => c.shot), Object.keys(HOME_CASE_SCREENSHOTS))
  for (const shot of Object.values(HOME_CASE_SCREENSHOTS)) {
    assert.ok(out['avtomatizaciya-biznesa'].includes(`<img src="/${shot.file}" alt="${shot.alt}"`), `нет скриншота ${shot.file}`)
  }
  // Ключи, ушедшие с главной (#518), стоят в H2 сырого HTML раздела.
  const h2 = [...out['avtomatizaciya-biznesa'].matchAll(/<h2>([^<]*)<\/h2>/g)].map((m) => m[1]).join(' | ').toLowerCase()
  for (const phrase of ['управление бизнес-процессами', 'описание и анализ бизнес-процессов']) assert.ok(h2.includes(phrase), `нет «${phrase}» в H2: ${h2}`)
  // Форма заявки стоит в разделе, к ней ведёт главная кнопка.
  assert.ok(auto.blocks.some((b) => b.type === 'form' && b.id === 'zayavka'))
})

test('цены разделов совпадают с каталогом услуг', () => {
  const cloud = SERVICES.find((s) => s.id === 'cloud')
  for (const p of CLOUD_PLANS) {
    assert.ok(cloud.features.some((f) => f.includes(`«${p.name}»`) && f.includes(p.price)), `тариф «${p.name}» ${p.price} разошёлся с services.mjs`)
  }
  const auto = SITE_SECTIONS.find((s) => s.slug === 'avtomatizaciya-biznesa')
  const pricing = auto.blocks.find((b) => b.type === 'pricing')
  assert.deepEqual(pricing.services, ['pilot', 'development', 'license'])
  for (const id of pricing.services) {
    const sv = SERVICES.find((x) => x.id === id)
    assert.ok(out['avtomatizaciya-biznesa'].includes(`${sv.name} — ${sv.priceFrom ? 'от ' : ''}${formatPrice(sv.price)} ${sv.unit}`), `нет цены ${id}`)
  }
})
