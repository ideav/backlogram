// #820: колонка «Ресурсы» подвала сокращена — часть пунктов свёрнута под «Ещё…»,
// юридические ссылки уехали в нижнюю строку к реквизитам.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { footerNavGroups, footerLegalLinks, staticNavLinks } from '../src/data/nav.mjs'

// new URL прямо в readFileSync — на Windows `.pathname` даёт `/C:/…` (ENOENT).
const footer = readFileSync(new URL('../src/components/Footer.tsx', import.meta.url), 'utf8')
const resources = footerNavGroups.find((g) => g.title === 'Ресурсы')

test('в «Ресурсах» на виду не больше 7 пунктов, остальное — под «Ещё…»', () => {
  const shown = resources.links.filter((l) => !l.more)
  assert.ok(shown.length <= 7, `на виду ${shown.length} пунктов`)
  assert.ok(resources.links.some((l) => l.more), 'должны быть свёрнутые пункты')
  assert.match(footer, /<details/)
  assert.match(footer, /Ещё…/)
})

test('на виду то, что кликают по Метрике: RUTUBE, документация, база знаний, сравнение', () => {
  const shown = resources.links.filter((l) => !l.more).map((l) => l.href)
  for (const href of [
    'https://rutube.ru/channel/41204904/videos/',
    'https://help.integram.io/',
    '/knowledge-base.html',
    '/sravnenie-s-bitrix-amocrm.html',
  ]) {
    assert.ok(shown.includes(href), `${href} должен быть на виду`)
  }
})

test('правила и политика — в нижней строке подвала, а не в «Ресурсах»', () => {
  for (const href of ['/terms.html', '/privacy.html']) {
    assert.ok(!resources.links.some((l) => l.href === href), `${href} не в «Ресурсах»`)
    assert.ok(footerLegalLinks.some((l) => l.href === href))
    assert.ok(staticNavLinks().some((l) => l.href === href), `${href} остаётся в статическом блоке`)
    assert.match(footer, new RegExp(`to="${href.replace('.', '\\.')}"`))
  }
})

test('клики подвала пишутся в параметры визита', () => {
  assert.match(footer, /visitParams\(\{ footer_click:/)
})
