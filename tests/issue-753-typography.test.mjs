// issue #753: число не отрывается от единицы измерения и счётного слова,
// предлог — от своего слова. Живой случай — hero квиза: «Приложение …
// в 4 раза дешевле» рвалось на «в 4» и «раза» — правило #627 склеило предлог
// с числом, но не число со словом «раза». Заодно здесь живут правила для
// смонтированного SPA: React перерисовывает снапшот, и склейка обязана быть
// и на границе рендера (src/lib/install-typography.ts).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { nbsp, nbspText } from '../src/lib/typography.mjs'

// Неразрывный пробел литералом в тест не пишем — невидимый символ хрупок.
const NB = String.fromCharCode(0xa0)

test('число держится за счётное слово и предлог: «в 4 раза»', () => {
  assert.equal(nbsp('в 4 раза дешевле'), 'в&nbsp;4&nbsp;раза дешевле')
  assert.equal(nbspText('в 4 раза дешевле'), `в${NB}4${NB}раза дешевле`)
})

test('число держится за единицу и за разряды: «от 75 000 ₽»', () => {
  assert.equal(nbsp('от 75 000 ₽'), 'от&nbsp;75&nbsp;000&nbsp;₽')
  assert.equal(nbsp('1 неделя'), '1&nbsp;неделя')
  assert.equal(nbsp('2–3 недели'), '2–3&nbsp;недели')
  assert.equal(nbsp('Шаг 1 из 4'), 'Шаг 1&nbsp;из&nbsp;4')
})

test('числительное словом держит следующее слово', () => {
  assert.equal(nbsp('за пару минут'), 'за&nbsp;пару&nbsp;минут')
  assert.equal(nbsp('Без брифов на десять страниц.'), 'Без&nbsp;брифов на&nbsp;десять&nbsp;страниц.')
})

test('трёхбуквенные предлоги и союзы тоже не висят в конце строки', () => {
  assert.equal(nbsp('без брифов'), 'без&nbsp;брифов')
  assert.equal(nbsp('для вас'), 'для&nbsp;вас')
  assert.equal(nbsp('под ключ'), 'под&nbsp;ключ')
  assert.equal(nbsp('поговорим или расстанемся'), 'поговорим или&nbsp;расстанемся')
})

test('число клеится и к латинице: «4 times»', () => {
  assert.equal(nbsp('4 times faster'), '4&nbsp;times faster')
})

test('правила идемпотентны — повторный проход ничего не меняет', () => {
  const once = nbsp('в 4 раза дешевле и быстрее за 2 минуты')
  assert.equal(nbsp(once), once)
  const onceText = nbspText('в 4 раза дешевле и быстрее за 2 минуты')
  assert.equal(nbspText(onceText), onceText)
})

test('nbspText склеивает символом U+00A0, а не сущностью', () => {
  const glued = nbspText('в 4 раза')
  assert.ok(!glued.includes('&'))
  assert.equal(glued.charCodeAt(1), 0xa0)
})

test('SPA-страницы живут по тем же правилам: проход ставится в App', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
  assert.match(app, /installTypography\(\)/)

  const installer = readFileSync(new URL('../src/lib/install-typography.ts', import.meta.url), 'utf8')
  assert.match(installer, /nbspText/)
  assert.match(installer, /MutationObserver/)
})
