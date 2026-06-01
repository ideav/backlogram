import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const indexSource = readFileSync(new URL('../index.html', import.meta.url), 'utf8')

test('index.html exposes SEO title, description and keywords', () => {
  assert.match(
    indexSource,
    /<title>Конструктор Интеграм — приложения и базы данных без кода<\/title>/,
  )
  assert.match(
    indexSource,
    /<meta name="description" content="Интеграм — российский конструктор приложений и баз данных без программирования\. Формы, отчёты и автоматизация бизнеса\. Аналог Airtable, замена Excel\." \/>/,
  )
  assert.match(
    indexSource,
    /<meta name="keywords" content="интеграмщик,автоматизация бизнеса,гугл таблицы,создать базу данных,конструктор интеграм,интеграм,российский airtable,аналог airtable,airtable,google-tables,конструктор приложений,приложение без программирования,квинтетная модель данных,no-code,nocode,low code,зерокод,конструктор SQL,замена excel" \/>/,
  )
})
