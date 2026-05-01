import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const startSource = readFileSync(new URL('../start.html', import.meta.url), 'utf8')

test('start.html skips SmartCaptcha for visitors with a valid idb_* cookie', () => {
  assert.match(
    startSource,
    /document\.cookie\.split\(';'\)\.some\(function \(c\) \{/,
    'should split document.cookie to check for idb_* cookies',
  )
  assert.match(
    startSource,
    /c\.trimStart\(\)\.indexOf\('idb_'\) === 0/,
    'should detect any idb_* cookie prefix',
  )
  assert.match(
    startSource,
    /data-skip-captcha/,
    'should mark the page as captcha-skipped via data-skip-captcha attribute',
  )
  assert.match(
    startSource,
    /\.smartcaptcha-wrapper|data-smartcaptcha/,
    'should hide the SmartCaptcha widget element when idb_* cookie is present',
  )
  assert.match(
    startSource,
    /input\[name="smart-token"\]/,
    'should set a placeholder captcha token so the form can submit without a real captcha',
  )
})
