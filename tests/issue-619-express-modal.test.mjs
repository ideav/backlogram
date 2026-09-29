import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

const read = (p) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8')

const landing = read('../site-excel/src/Landing.tsx')
const pricing = read('../site-excel/src/Pricing.tsx')
const conversion = read('../site-excel/src/conversion.ts')
const orderPhp = read('../site-excel/public/order.php')

// Issue #619: кнопки блока «Сколько стоит» ведут на модальную заявку
// «Заявка на экспресс-разработку приложений» с целью Метрики, которую кликер
// не достанет; остальные цели страницы — не ближе, чем через проверку.

const modalSource = landing.slice(
  landing.indexOf('function ExpressModal'),
  landing.indexOf('export default function Landing'),
)

test('карточки цен открывают модальную заявку с названием карточки', () => {
  assert.match(pricing, /onClick=\{\(\) => onOrder\(plan\.title\)\}/)
  assert.match(landing, /<Pricing onOrder=\{setExpressPlan\} \/>/)
  assert.match(landing, /\{expressPlan && <ExpressModal plan=\{expressPlan\} onClose=\{closeExpress\} \/>\}/)
})

test('модалка — диалог с заголовком из issue и формой вида express', () => {
  assert.ok(modalSource.length > 0, 'нет компонента ExpressModal')
  assert.match(modalSource, /role="dialog"/)
  assert.match(modalSource, /aria-modal="true"/)
  assert.match(modalSource, /title="Заявка на экспресс-разработку приложений"/)
  assert.match(modalSource, /kind="express"/)
  assert.match(modalSource, /event\.key === 'Escape'/)
  // По фону не закрывается: случайный клик не должен стирать набранный текст.
  assert.ok(!/<div[^>]*role="dialog"[^>]*onClick/s.test(modalSource))
})

test('открытие модалки целей не шлёт — цель только после принятой заявки', () => {
  assert.ok(!/reachGoal|reachSignupGoal|reachExpressGoal/.test(modalSource), 'модалка сама целей не шлёт')
  assert.ok(!/reachGoal|reachSignupGoal|reachExpressGoal/.test(pricing), 'карточки цен целей не шлют')
  // Цель — в OrderForm, после проверки ответа order.php.
  const submit = landing.slice(landing.indexOf('async function submit'), landing.indexOf('if (sent)'))
  const okCheck = submit.indexOf('if (!response.ok || !payload.ok)')
  const goal = submit.indexOf("if (kind === 'express') reachExpressGoal(")
  assert.ok(okCheck > 0 && goal > okCheck, 'express_lead должна уходить только после ответа «принято»')
})

test('цель express_lead проходит проверку на человека', () => {
  assert.match(conversion, /express: 'express_lead'/)
  assert.match(conversion, /expressBlocked: 'express_blocked'/)
  assert.match(conversion, /reachGoal\(looksHuman\(\) \? GOALS\.express : GOALS\.expressBlocked, params\)/)
})

test('order.php принимает вид express и карточку', () => {
  assert.match(orderPhp, /in_array\(\$data\['kind'\] \?\? '', \['demo', 'express'\], true\)/)
  assert.match(orderPhp, /'express' => 'Заявка на экспресс-разработку приложений'/)
  assert.match(orderPhp, /'Карточка: ' \. \$plan/)
})

test('на странице нет mailto: клик по нему — автоцель, доступная с первого экрана', () => {
  assert.ok(!landing.includes('mailto:'))
})
