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
    /if \(!CAPTCHA_CLIENT_KEY \|\| !isCaptchaRequested\) return/,
    'SmartCaptcha should not load or render before Email / Telegram input starts.',
  )
  assert.match(
    homeSource,
    /onInput=\{\(\) => setIsCaptchaRequested\(true\)\}/,
    'Email / Telegram input should request the captcha once the visitor types.',
  )
  assert.match(
    homeSource,
    /\{CAPTCHA_CLIENT_KEY && isCaptchaRequested && \(/,
    'Captcha container should not be visible before the visitor types.',
  )
})
