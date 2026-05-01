import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const indexSource = readFileSync(new URL('../public/index.php', import.meta.url), 'utf8')

test('index.php skips SmartCaptcha verification for visitors with a valid idb_* cookie', () => {
  assert.match(
    indexSource,
    /preg_grep\('\/\^idb_\/'.*array_keys\(\$_COOKIE\)\)/,
    'should detect idb_* cookies using preg_grep on $_COOKIE keys',
  )
  assert.match(
    indexSource,
    /\$hasIdbCookie/,
    'should store the idb_* cookie presence in $hasIdbCookie',
  )
  assert.match(
    indexSource,
    /!\$hasIdbCookie && !verifyCaptcha\(/,
    'should skip captcha verification when $hasIdbCookie is true',
  )
})

test('index.php reads the captcha token from smart-token or captcha_token field', () => {
  assert.match(
    indexSource,
    /\$data\['smart-token'\].*\$data\['captcha_token'\]/,
    'should accept both smart-token (start.html field name) and captcha_token field names',
  )
})

test('index.php has verifyCaptcha function with SmartCaptcha server-side validation', () => {
  assert.match(
    indexSource,
    /function verifyCaptcha\(string \$token\): bool/,
    'should define verifyCaptcha function',
  )
  assert.match(
    indexSource,
    /smartcaptcha\.yandexcloud\.net\/validate/,
    'should call Yandex SmartCaptcha validation endpoint',
  )
})
