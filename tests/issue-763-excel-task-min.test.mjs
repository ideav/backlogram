import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Issue #763: заявка «Задача: работа иксель» прошла обязательное поле, а человек
// искал работу. Без файлов форма и order.php требуют описать задачу.

const read = (p) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8')
const landing = read('../site-excel/src/Landing.tsx')
const content = read('../site-excel/src/content.ts')
const conversion = read('../site-excel/src/conversion.ts')
const orderPhp = read('../site-excel/public/order.php')

const minChars = Number(content.match(/export const MIN_TASK_CHARS = (\d+)/)?.[1])

test('порог описания задачи один на форме и в order.php', () => {
  assert.ok(minChars >= 30, 'MIN_TASK_CHARS задан и не символический')
  assert.match(orderPhp, new RegExp(`mb_strlen\\(\\$task\\) < ${minChars}\\)`))
})

test('order.php режет короткое описание без файлов, разбор не трогает', () => {
  assert.match(orderPhp, /\$kind !== 'razbor' && !\$attachments && mb_strlen\(\$task\) < \d+/)
})

test('«работа иксель» короче порога', () => {
  assert.ok('работа иксель'.length < minChars)
})

test('форма проверяет длину до отправки и шлёт цель lead_short', () => {
  assert.match(conversion, /leadShort: 'lead_short'/)
  const submit = landing.slice(landing.indexOf('async function submit'))
  const check = submit.indexOf('MIN_TASK_CHARS')
  assert.ok(check > 0, 'проверка длины в submit')
  assert.ok(check < submit.indexOf('fetch(SUBMIT_ENDPOINT'), 'проверка до запроса к order.php')
  assert.match(submit, /files\.length === 0/, 'с файлами описание может быть короче')
  assert.match(submit, /reachGoal\(GOALS\.leadShort/)
})

test('минус-слова дописываются к живым, правки мимо файла не теряются', async () => {
  const { mergeNegatives } = await import('../scripts/direct-add-negatives.mjs')
  const live = ['скачать', 'бесплатно', 'xls', '!не открывается']
  const { items, added } = mergeNegatives(live, ['скачать', 'семья', 'Скан'])
  assert.deepEqual(added, ['семья', 'Скан'])
  assert.deepEqual(items.slice(0, live.length), live)
  assert.equal(mergeNegatives(items, ['семья']).added.length, 0, 'повторный прогон ничего не добавляет')
})

test('в поле задачи — пример-подсказка', () => {
  assert.match(landing, /placeholder=\{kind === 'razbor' \? undefined : TASK_PLACEHOLDER\}/)
  assert.ok((content.match(/TASK_PLACEHOLDER =\s*'([^']+)'/)?.[1] ?? '').length >= minChars)
})
