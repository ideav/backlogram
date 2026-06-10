import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8')

const pageSource = read('../src/pages/ExcelToApp.tsx')

test('the payment offer is gated behind the #12500 hash (hidden by default)', () => {
  // Same hash-reveal pattern as start.html#reg: a single hash constant decides
  // whether the block renders, and the block is wrapped in that condition.
  assert.match(pageSource, /const PAYMENT_HASH = '#12500'/)
  assert.match(pageSource, /const \{ hash \} = useLocation\(\)/)
  assert.match(pageSource, /const showPaymentOffer = hash === PAYMENT_HASH/)
  assert.match(pageSource, /\{showPaymentOffer && \(/)
})

test('the payment offer block carries the #12500 anchor and is focused', () => {
  // App.tsx ScrollToRouteTarget scrolls to getElementById(hash) — id must match.
  assert.match(pageSource, /id="12500"/)
  // Focus is moved to the block when it appears, per "Фокус ставить на этот блок".
  assert.match(pageSource, /paymentRef\.current/)
  assert.match(pageSource, /\.scrollIntoView\(/)
  assert.match(pageSource, /\.focus\(/)
})

test('the payment offer states all three prices from the email', () => {
  assert.match(pageSource, /12 500 ₽/) // take the demo now
  assert.match(pageSource, /28 500 ₽/) // restore the archived base later
  assert.match(pageSource, /1 950 ₽ в месяц/) // cost of ownership
})

test('the payment offer keeps the 3-hour limited-time framing', () => {
  assert.match(pageSource, /в течение 3 часов/)
  assert.match(pageSource, /заархивирована/)
})

test('the payment offer has a pay CTA to the Telegram contact', () => {
  assert.match(pageSource, /const PAYMENT_CONTACT_URL = 'https:\/\/t\.me\/qdmadept'/)
  assert.match(pageSource, /Оплатить 12 500 ₽ и забрать базу/)
})
