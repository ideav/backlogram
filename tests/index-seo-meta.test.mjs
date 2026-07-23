import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const indexSource = readFileSync(new URL('../index.html', import.meta.url), 'utf8')

test('index.html exposes SEO title, description and keywords', () => {
  assert.match(
    indexSource,
    /<title>Интеграм — no-code конструктор приложений из Excel за час \| Airtable<\/title>/,
  )
  assert.match(
    indexSource,
    /<meta name="description" content="Из Excel — рабочее приложение за час: формы, доступы, отчёты\. No-code конструктор баз данных, замена Excel и Google Sheets, аналог Airtable\. В реестре ПО\." \/>/,
  )
  assert.match(
    indexSource,
    /<meta name="keywords" content="из excel приложение,excel в приложение,замена excel за час,приложение за час,приложение из excel,автоматизация бизнеса,гугл таблицы,создать базу данных,конструктор интеграм,интеграм,российский airtable,аналог airtable,airtable,конструктор приложений,приложение без программирования,no-code,nocode,low code,зерокод,замена excel" \/>/,
  )
})

test('index.html SEO leads with the single «Excel → приложение за час» offer', () => {
  assert.match(indexSource, /<title>[^<]*Excel[^<]*час/)
  assert.match(indexSource, /<meta name="description" content="[^"]*Excel[^"]*час/)
})
