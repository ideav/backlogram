import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const homeSource = readFileSync(new URL('../src/pages/Home.tsx', import.meta.url), 'utf8')

function findAnchorByText(source, text) {
  const anchors = source.match(/<a\b[\s\S]*?<\/a>/g) ?? []
  return anchors.find((anchor) => anchor.includes(text))
}

test('in-page CTA link stays in the current tab and lands below the fixed header', () => {
  // #827: ссылка «У меня особый случай!» ушла вместе с блоком «Для кого» —
  // то же правило держит кнопка hero «Отправить задачу из очереди задач».
  const inPageLink = findAnchorByText(homeSource, 'Отправить задачу из очереди задач')
  assert.ok(inPageLink, 'Expected the in-page CTA link to exist')
  assert.match(inPageLink, /href="#cta"/)
  assert.doesNotMatch(
    inPageLink,
    /\btarget=/,
    'In-page CTA link should not open a named tab',
  )
  assert.doesNotMatch(
    inPageLink,
    /\brel=/,
    'In-page CTA link should not use external-link rel attributes',
  )

  const ctaSection = homeSource.match(/<section\s+id="cta"\s+className="([^"]+)"/)
  assert.ok(ctaSection, 'Expected the CTA section to exist')
  assert.match(
    ctaSection[1],
    /(?:^|\s)scroll-mt-\d+(?:\s|$)/,
    'CTA target needs scroll margin so the fixed header does not cover it',
  )
})

// #827: блоки главной переехали в разделы, но их якоря живут в рекламе и
// ссылках — /#ai и остальные переадресуются на тот же блок раздела.
test('moved home anchors (ads link /#ai) redirect to the same block in a section', async () => {
  assert.match(homeSource, /ai: '\/avtomatizaciya-biznesa\.html#ai'/)
  assert.match(homeSource, /const target = MOVED_ANCHORS\[hash\.slice\(1\)\]/)
  assert.match(homeSource, /navigate\(target, \{ replace: true \}\)/)
  const { SITE_SECTIONS } = await import('../src/data/siteSections.mjs')
  const ids = new Map(SITE_SECTIONS.map((s) => [`/${s.slug}.html`, new Set(s.blocks.map((b) => b.id))]))
  const map = homeSource.slice(homeSource.indexOf('MOVED_ANCHORS'), homeSource.indexOf('export default function Home'))
  const targets = [...map.matchAll(/: '([^']+)'/g)].map((m) => m[1])
  assert.ok(targets.length >= 10)
  for (const t of targets) {
    const [page, id] = t.split('#')
    assert.ok(ids.has(page), `нет раздела ${page}`)
    if (id) assert.ok(ids.get(page).has(id), `нет блока #${id} в ${page}`)
    // Переадресованный блок не должен остаться на главной.
  }
  for (const key of [...map.matchAll(/^\s+'?([a-z-]+)'?: '/gm)].map((m) => m[1])) {
    assert.doesNotMatch(homeSource, new RegExp(`<section id="${key}"`), `#${key} всё ещё на главной`)
  }
})
