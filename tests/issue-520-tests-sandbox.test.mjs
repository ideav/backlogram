/**
 * issue #520 — тесты не трогают собранный dist/.
 *
 * `tests/issue-341-knowledge-base-canonical.test.mjs` писал исходный index.html
 * прямо в `dist/` репозитория и запускал там пререндер. В итоге `npm test`
 * после `npm run build` затирал собранный `dist/index.html` дев-шеллом со
 * ссылкой на `/src/main.tsx`: локальная проверка сборки показывала пустую
 * страницу и 404 в консоли.
 *
 * Правило простое: пререндеры в тестах гоняются в песочнице, а `dist/`
 * репозитория принадлежит сборке. Тест сторожит его по исходникам самих
 * тестов — иначе такое возвращается незаметно.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const testsDir = new URL('.', import.meta.url).pathname
const files = readdirSync(testsDir)
  .filter((name) => name.endsWith('.test.mjs'))
  .filter((name) => name !== 'issue-520-tests-sandbox.test.mjs')

test('ни один тест не адресует dist/ репозитория', () => {
  for (const name of files) {
    const source = readFileSync(resolve(testsDir, name), 'utf8')
    assert.doesNotMatch(
      source,
      /resolve\((?:repo|root), 'dist'\)|new URL\('\.\.\/dist/,
      `${name}: dist/ репозитория принадлежит сборке — гоняйте пререндер в песочнице`,
    )
  }
})

test('пререндеры в тестах запускаются не в корне репозитория', () => {
  for (const name of files) {
    const source = readFileSync(resolve(testsDir, name), 'utf8')
    for (const call of source.matchAll(/execFileSync\(([\s\S]*?)\)\n/g)) {
      if (!call[1].includes('prerender')) continue
      assert.ok(
        !/cwd:\s*repo\b/.test(call[1]),
        `${name}: пререндер запущен с cwd репозитория — он перезапишет dist/`,
      )
    }
  }
})
