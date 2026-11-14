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
  assert.match(pageSource, /18 500 ₽/) // take the base after the trial
  assert.match(pageSource, /28 500 ₽/) // restore the archived base later
  assert.match(pageSource, /1 950 ₽ в месяц/) // cost of ownership
})

test('the payment offer states the 14-day trial framing', () => {
  assert.match(pageSource, /Первые 14 дней — бесплатный триал/)
  assert.match(pageSource, /заархивирована/)
})

test('the pay CTA is a two-step Tochka checkout flow (issue #335)', () => {
  // Step 1: the CTA button reveals the email field instead of linking to Telegram.
  assert.match(pageSource, /Оплатить 18 500 ₽ и забрать базу/)
  assert.match(pageSource, /onClick=\{\(\) => setShowPayForm\(true\)\}/)
  // Step 2: email is collected, validated, then the page redirects to the
  // Tochka checkout link (same pattern as start.html #promoPayButton).
  assert.match(pageSource, /const PAYMENT_CHECKOUT_URL = 'https:\/\/tochkaplace\.com\/ia\/723252cf-4583-4967-83fe-e9630b207f9f'/)
  assert.match(pageSource, /isPaymentEmailValid\(/)
  assert.match(pageSource, /window\.location\.href = PAYMENT_CHECKOUT_URL/)
  // The Telegram contact is no longer the payment CTA.
  assert.doesNotMatch(pageSource, /href=\{PAYMENT_CONTACT_URL\}/)
})
