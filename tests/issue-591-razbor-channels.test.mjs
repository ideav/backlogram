// issue #591 — «Обсудить разбор» не только в Telegram: двухэтапный CTA
// (шаг 1 — кнопка раскрывает выбор канала; шаг 2 — Telegram @qdmadept /
// позвонить / заказать звонок с предзаполненным примечанием) + цели Метрики
// на каждое действие второго этапа.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const page = readFileSync(join(root, 'src/pages/ExcelToApp.tsx'), 'utf8')
const notifyPhp = readFileSync(join(root, 'public/telegram-notify.php'), 'utf8')

test('разбор ведёт к человеку @qdmadept, а не к боту загрузки Excel', () => {
  assert.ok(page.includes(`const RAZBOR_TELEGRAM_URL = 'https://t.me/qdmadept'`))
  const razborChunk = page.slice(page.indexOf('Шаг 2: каналы связи'), page.indexOf('Шаг 2: каналы связи') + 1500)
  assert.ok(razborChunk.includes('RAZBOR_TELEGRAM_URL'), 'карточка Telegram должна использовать RAZBOR_TELEGRAM_URL')
  assert.ok(!razborChunk.includes('TELEGRAM_BOT_URL'), 'в каналах разбора не должно быть ссылки на Integrammbot')
})

test('двухэтапность: кнопка-раскрывашка и три канала', () => {
  assert.ok(page.includes('setRazborOpen(true)'), 'шаг 1 — кнопка открывает выбор')
  assert.ok(page.includes('Написать в Telegram'))
  assert.ok(page.includes('Позвонить'))
  assert.ok(page.includes('Заказать звонок'))
  assert.ok(page.includes(`tel:\${RAZBOR_PHONE_HREF}`), 'нет tel:-ссылки')
  assert.ok(page.includes(`RAZBOR_PHONE_HREF = '+79955060167'`), 'телефон должен совпадать с контактами сайта')
})

test('форма звонка: предзаполненное примечание, телефон, согласие, отправка в telegram-notify', () => {
  assert.ok(page.includes(`RAZBOR_NOTE_DEFAULT = 'Разбор ИИ-приложения'`), 'нет предзаполненного примечания из issue')
  assert.ok(page.includes('useState(RAZBOR_NOTE_DEFAULT)'), 'примечание должно быть предзаполнено')
  assert.ok(page.includes(`source: 'excel-to-app-razbor'`), 'нет источника заявки')
  const submitChunk = page.slice(page.indexOf('async function handleCallbackSubmit'), page.indexOf('async function handleCallbackSubmit') + 2500)
  assert.ok(submitChunk.includes(`fetch('/telegram-notify.php'`), 'форма должна слать в telegram-notify.php')
  assert.ok(submitChunk.includes('Заказ звонка:'), 'задача должна помечаться как заказ звонка')
})

test('цели Метрики на действия второго этапа', () => {
  for (const goal of ['razbor_tg', 'razbor_call', 'razbor_callback']) {
    assert.ok(page.includes(`reachGoal('${goal}'`), `нет цели ${goal}`)
  }
})

test('telegram-notify.php знает источник excel-to-app-razbor', () => {
  assert.ok(notifyPhp.includes(`'excel-to-app-razbor'`), 'нет метки источника')
  assert.ok(notifyPhp.includes('Разбор ИИ-приложения — заказ звонка'), 'нет человекочитаемой подписи источника')
})
