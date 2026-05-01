import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const homeSource = readFileSync(new URL('../src/pages/Home.tsx', import.meta.url), 'utf8')

test('CTA captcha is hidden until the contact field receives user input', () => {
  assert.match(
    homeSource,
    /const \[isCaptchaRequested, setIsCaptchaRequested\] = React\.useState\(false\)/,
    'CTA should track whether the visitor started entering Email / Telegram.',
  )
  assert.match(
    homeSource,
    /if \(!CAPTCHA_CLIENT_KEY \|\| !isCaptchaRequested \|\| idbCookieFound\) return/,
    'SmartCaptcha should not load or render before Email / Telegram input starts, or when idb_* cookie is present.',
  )
  assert.match(
    homeSource,
    /onInput=\{\(\) => setIsCaptchaRequested\(true\)\}/,
    'Email / Telegram input should request the captcha once the visitor types.',
  )
  assert.match(
    homeSource,
    /\{CAPTCHA_CLIENT_KEY && !idbCookieFound && isCaptchaRequested && \(/,
    'Captcha container should not be visible before the visitor types, or when idb_* cookie is present.',
  )
})

test('CTA captcha is skipped for visitors with a valid idb_* cookie', () => {
  assert.match(
    homeSource,
    /function hasIdbCookie\(\): boolean/,
    'hasIdbCookie helper function should be defined.',
  )
  assert.match(
    homeSource,
    /document\.cookie\.split\(';'\)\.some\(c => c\.trimStart\(\)\.startsWith\('idb_'\)\)/,
    'hasIdbCookie should check document.cookie for any idb_* prefix.',
  )
  assert.match(
    homeSource,
    /const \[idbCookieFound\] = React\.useState\(\(\) => hasIdbCookie\(\)\)/,
    'idbCookieFound state should be initialised from hasIdbCookie().',
  )
  assert.match(
    homeSource,
    /if \(CAPTCHA_CLIENT_KEY && !idbCookieFound\)/,
    'Captcha token should not be required when an idb_* cookie is present.',
  )
})
