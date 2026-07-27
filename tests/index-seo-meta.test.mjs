import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const indexSource = readFileSync(new URL('../index.html', import.meta.url), 'utf8')

// issue #488 (af.md, блок 15): мета главной под семантическое ядро — заголовок и
// описание заданы ДОСЛОВНО из af.md; keywords-строку не трогали.
test('index.html exposes SEO title, description and keywords', () => {
  assert.match(
    indexSource,
    /<title>Интеграм — no-code конструктор приложений \| Замена Excel, аналог Airtable<\/title>/,
  )
  assert.match(
    indexSource,
    /<meta name="description" content="Российская no-code платформа: из Excel-таблицы — веб-приложение за 45 минут\. Реляционные данные, on-premise, права доступа\. В реестре отечественного ПО\. Попробуйте бесплатно\." \/>/,
  )
  assert.match(
    indexSource,
    /<meta name="keywords" content="из excel приложение,excel в приложение,замена excel за час,приложение за час,приложение из excel,автоматизация бизнеса,гугл таблицы,создать базу данных,конструктор интеграм,интеграм,российский airtable,аналог airtable,airtable,конструктор приложений,приложение без программирования,no-code,nocode,low code,зерокод,замена excel" \/>/,
  )
})

test('index.html SEO leads with the brand + Excel/Airtable substitution offer', () => {
  assert.match(indexSource, /<title>[^<]*Интеграм[^<]*Замена Excel/)
  assert.match(indexSource, /<meta name="description" content="[^"]*Excel-таблицы[^"]*45 минут/)
})
