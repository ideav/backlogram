import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const indexSource = readFileSync(new URL('../index.html', import.meta.url), 'utf8')

test('index.html exposes SEO description and keywords', () => {
  assert.match(
    indexSource,
    /<meta name="description" content="Конструктор баз данных и приложений для создания форм и замены экселя" \/>/,
  )
  assert.match(
    indexSource,
    /<meta name="keywords" content="интеграмщик,автоматизация бизнеса,гугл таблицы,создать базу данных,конструктор интеграм,интеграм,российский airtable,аналог airtable,airtable,google-tables,конструктор приложений,приложение без программирования,квинтетная модель данных,no-code,nocode,low code,зерокод,конструктор SQL,замена excel" \/>/,
  )
})
