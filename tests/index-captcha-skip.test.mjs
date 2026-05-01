import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const indexSource = readFileSync(new URL('../index.php', import.meta.url), 'utf8')

test('index.php skips SmartCaptcha verification for users with a valid idb_$z cookie on login', () => {
  assert.match(
    indexSource,
    /isset\(\$_POST\["smart-token"\]\) && !isset\(\$_COOKIE\["idb_\$z"\]\) && !verifyCaptcha\(\$_POST\["smart-token"\]\)/,
    'login should skip captcha when the idb_$z cookie is present',
  )
})
