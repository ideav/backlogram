import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const indexSource = readFileSync(new URL('../index.php', import.meta.url), 'utf8')

test('index.php skips SmartCaptcha verification for users with any idb_* cookie on login', () => {
  assert.match(
    indexSource,
    /preg_grep\('\/\^idb_\/', array_keys\(\$_COOKIE\)\)/,
    'login should detect any idb_* cookie using preg_grep on array_keys($_COOKIE)',
  )
  assert.match(
    indexSource,
    /!\$hasAnyIdbCookie && !verifyCaptcha\(\$_POST\["smart-token"\]\)/,
    'login should skip captcha when any idb_* cookie is present (not just idb_$z)',
  )
})
