import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

// Галочка согласия под формой на excel-to-app.ru вела на якорь `#privacy` —
// подвал этого же лендинга. Своей страницы политики у домена нет, подвал даёт
// только краткую справку, а сам переход на практике никуда не уводил. Политика
// живёт на основном сайте (/privacy.html, #542), поэтому лендинг на отдельном
// домене ссылается туда абсолютным адресом.

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8')
const landingSource = read('../site-excel/src/Landing.tsx')

test('согласие ведёт на политику основного сайта, а не на якорь лендинга', () => {
  assert.match(landingSource, /const PRIVACY_URL = 'https:\/\/ideav\.ru\/privacy\.html'/)
  assert.ok(
    !landingSource.includes('href="#privacy"'),
    'якорь #privacy ведёт в подвал лендинга, а не на политику',
  )
  // Ссылка под галочкой берёт адрес из константы.
  const consent = landingSource
    .split('Даю согласие на обработку персональных данных на условиях')[1]
    ?.split('</label>')[0]
  assert.ok(consent, 'галочка согласия должна остаться на месте')
  assert.match(consent, /href=\{PRIVACY_URL\}/)
})

test('политика открывается в новой вкладке — заполненная форма не теряется', () => {
  // В форме есть вложения: уход со страницы стирает выбранные файлы.
  const links = landingSource.match(/<a\s[\s\S]*?>/g).filter(a => a.includes('PRIVACY_URL'))
  assert.ok(links.length >= 2, 'ссылки на политику: под галочкой и в подвале')
  for (const link of links) {
    assert.match(link, /target="_blank"/)
    assert.match(link, /rel="noopener noreferrer"/)
  }
})

test('подвал по-прежнему даёт доступ к политике (ч. 2 ст. 18.1 152-ФЗ)', () => {
  const footer = landingSource.split('<footer')[1]?.split('</footer>')[0]
  assert.ok(footer, 'подвал должен существовать')
  assert.match(footer, /href=\{PRIVACY_URL\}/)
})
