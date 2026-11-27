// backlogram#1032: словарь терминов отдельной страницей — все слова сайта,
// справки (бывший словарик /help.html) и каталога решений.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  GLOSSARY_META, GLOSSARY_GROUPS, GLOSSARY_TERMS, glossaryByLetter, glossaryMatches,
} from '../src/data/glossary.mjs'
import { footerNavGroups } from '../src/data/nav.mjs'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')

test('страница заведена: роут, карта сайта, llms.txt, меню, сборка, .htaccess', () => {
  assert.equal(GLOSSARY_META.path, '/slovar-terminov.html')
  assert.match(read('src/router.tsx'), /path: 'slovar-terminov\.html'/)
  assert.ok(read('public/sitemap.xml').includes('<loc>https://ideav.ru/slovar-terminov.html</loc>'))
  assert.ok(read('public/llms.txt').includes('https://ideav.ru/slovar-terminov.html'))
  assert.match(read('public/.htaccess'), /RewriteRule \^slovar-terminov\/\?\$ \/slovar-terminov\.html/)
  assert.match(read('package.json'), /prerender-glossary\.mjs && .*prerender-landing\.mjs/)
  const hrefs = JSON.stringify(footerNavGroups)
  assert.ok(hrefs.includes('/slovar-terminov.html'), 'нет в меню — страница-сирота')
})

test('словарик справки переехал: на хабе ссылка, а все его термины — в словаре', () => {
  assert.ok(read('scripts/prerender-help.mjs').includes("link('/slovar-terminov.html'"))
  assert.ok(read('src/pages/HelpCenter.tsx').includes('href="/slovar-terminov.html"'))
  const names = new Set(GLOSSARY_TERMS.flatMap((t) => [t.term, ...(t.aka || [])].map((s) => s.toLowerCase())))
  for (const n of ['база', 'запись', 'реквизит', 'базовый тип', 'ссылка', 'справочник', 'подчинённая таблица',
    'квинтет', 'редактор структуры', 'рабочее место', 'шаблонизатор', 'роль', 'маска', 'api']) {
    assert.ok(names.has(n), `нет термина справки «${n}»`)
  }
})

test('термины со всех источников: справка, база знаний и каталог решений', () => {
  assert.ok(GLOSSARY_TERMS.length >= 150, `всего ${GLOSSARY_TERMS.length}`)
  const urls = GLOSSARY_TERMS.flatMap((t) => (t.sources || []).map((s) => s.url))
  assert.ok(urls.some((u) => u.startsWith('/help')), 'нет ссылок на справку')
  assert.ok(urls.some((u) => u.startsWith('/knowledge-base/')), 'нет ссылок на базу знаний')
  assert.ok(urls.some((u) => u.startsWith('https://ideav.ru/solutions/')), 'нет ссылок на каталог решений')
})

test('у термина уникальный якорь, известная группа и определение; без дублей', () => {
  const groups = new Set(GLOSSARY_GROUPS.map((g) => g.id))
  const ids = new Set()
  const names = new Set()
  for (const t of GLOSSARY_TERMS) {
    assert.match(t.id, /^[a-z0-9]+(-[a-z0-9]+)*$/, `плохой id ${t.id}`)
    assert.ok(!ids.has(t.id), `повтор id ${t.id}`)
    ids.add(t.id)
    const n = t.term.toLowerCase()
    assert.ok(!names.has(n), `повтор термина ${t.term}`)
    names.add(n)
    assert.ok(groups.has(t.group), `${t.term}: группа ${t.group}`)
    assert.ok(t.text.length >= 20, `${t.term}: пустое определение`)
    for (const s of t.sources || []) assert.match(s.url, /^(\/|https:\/\/ideav\.ru\/)/, `${t.term}: ${s.url}`)
  }
})

test('алфавитный указатель: кириллица раньше латиницы, все термины на месте', () => {
  const letters = glossaryByLetter()
  assert.equal(letters.reduce((n, l) => n + l.terms.length, 0), GLOSSARY_TERMS.length)
  const firstLatin = letters.findIndex((l) => /[A-Z0-9]/.test(l.letter))
  assert.ok(letters.slice(firstLatin).every((l) => !/[А-Я]/.test(l.letter)))
})

test('поиск: по имени, синониму и без учёта ё', () => {
  const t = { term: 'Подчинённая таблица', aka: ['табличная часть'], text: 'Дочерние записи' }
  assert.ok(glossaryMatches(t, 'подчиненная'))
  assert.ok(glossaryMatches(t, 'ТАБЛИЧНАЯ'))
  assert.ok(glossaryMatches(t, ''))
  assert.ok(!glossaryMatches(t, 'ERP'))
})
