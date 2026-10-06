/**
 * Issue #5085 (ideav/crm) — короткое верхнее меню на excel-to-app.ru.
 *
 * Просили 3–4 пункта «только самое основное». Итоговый набор — Примеры,
 * Как это происходит, Цены, Вопросы: все четыре цели видны до раскрытия
 * воронки, а «Контакты» отдельным пунктом не нужны — адрес и так стоит
 * в шапке справа (и продублирован в подвале).
 *
 * Тесты стерегут исходники по образцу tests/issue-626-excel-seo.test.mjs:
 * собранный dist они не трогают (см. README site-excel про выкладку).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

const read = (p) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8')

const chrome = read('../site-excel/src/Chrome.tsx')
const landing = read('../site-excel/src/Landing.tsx')

test('в шапке меню из четырёх якорей на секции главной', () => {
  const header = chrome.split('const MENU')[1]?.split('export function SiteFooter')[0]
  assert.ok(header, 'MENU и SiteHeader должны существовать')
  for (const href of ['#keysy', '#kak-proishodit', '#ceny', '#voprosy']) {
    assert.match(header, new RegExp(`href: '${href}'`), `пункт ${href} в меню`)
  }
  for (const label of ['Примеры', 'Как это происходит', 'Цены', 'Вопросы']) {
    assert.match(header, new RegExp(`label: '${label}'`), `подпись «${label}» в меню`)
  }
})

test('меню не тянет цели воронки: в шапке нет кнопок и пунктов про заявку', () => {
  // Целевая кнопка кампании на странице одна и живёт за первым кликом
  // (см. README site-excel); меню целевую не дублирует и воронку не открывает.
  const header = chrome.split('<header')[1]?.split('</header>')[0]
  assert.ok(header, 'липкая шапка должна существовать')
  assert.doesNotMatch(header, /<button/)
  for (const banned of ['#demo', '#price', '#zayavka', 'order.php']) {
    assert.ok(!header.includes(banned), `в шапке не должно быть ${banned}`)
  }
})

test('якорь «Как это происходит» существует: секция шагов помечена id', () => {
  // Пункт меню, ведущий в никуда, хуже отсутствия меню.
  const section = landing.split('id="kak-proishodit"')[1]?.split('</section>')[0]
  assert.ok(section, 'секция #kak-proishodit на главной')
  assert.match(section, /Как это происходит/)
  assert.match(
    landing,
    /<section id="kak-proishodit" className="scroll-mt-16 /,
    'секция учитывает высоту липкой шапки',
  )
})

test('остальные цели меню существовали до этого и не переехали', () => {
  assert.match(read('../site-excel/src/Cases.tsx'), /id="keysy"/)
  assert.match(read('../site-excel/src/Pricing.tsx'), /id="ceny"/)
  assert.match(read('../site-excel/src/Faq.tsx'), /id="voprosy"/)
})

test('на спутниках пункты меню ведут на главную: homeHref префиксует якоря', () => {
  // /keysy/<slug>/ и /sravnenie-power-apps/ получают ту же шапку; без
  // префикса якорь вёл бы на страницу-спутник, где такой секции нет.
  assert.match(chrome, /homeHref \? `\$\{homeHref\}\$\{href\}` : href/)
  assert.match(
    read('../site-excel/src/pages/StaticPage.tsx'),
    /<SiteHeader homeHref=\{SITE_BASE\} \/>/,
    'спутники передают homeHref',
  )
})

test('мобильное меню — вне липкой шапки, вторым рядом', () => {
  // Внутри sticky-шапки вторая строка увеличила бы её высоту, и scroll-mt-16
  // у секций перестал бы быть точным: заголовки прятались бы под шапкой.
  const mobileNav = chrome.split('md:hidden border-b')[1]?.split('</nav>')[0]
  assert.ok(mobileNav, 'мобильное меню существует')
  const headerClose = chrome.indexOf('</header>')
  const mobileOpen = chrome.indexOf('md:hidden border-b')
  assert.ok(headerClose !== -1 && mobileOpen > headerClose, 'мобильное меню после </header>')
  assert.match(mobileNav, /overflow-x-auto/, 'пункты не ломают узкий экран')
})
