// issue #500 — карта сайта для базы знаний собирается, а не дописывается руками.
//
// public/sitemap.xml и public/llms.txt — статические файлы, и новая статья в
// src/data/knowledgeBase.ts попадала в них только по памяти автора. Здесь два
// инварианта: (1) статейный раздел sitemap совпадает с массивом статей —
// «почини запуском скрипта», (2) шаг синхронизации реально стоит в сборке,
// иначе dist/ уедет со старой картой.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const repo = new URL('..', import.meta.url).pathname
const read = (p) => readFileSync(resolve(repo, p), 'utf8')

test('sitemap.xml и llms.txt перечисляют все статьи базы знаний', () => {
  try {
    execFileSync(process.execPath, ['scripts/sync-kb-sitemap.mjs', '--check'], {
      cwd: repo,
      encoding: 'utf8',
      stdio: 'pipe',
    })
  } catch (error) {
    assert.fail(
      `sync-kb-sitemap.mjs --check упал:\n${error.stderr || ''}${error.stdout || ''}`,
    )
  }
})

test('шаг синхронизации карты сайта стоит в сборке до vite build', () => {
  const build = JSON.parse(read('package.json')).scripts.build
  assert.ok(
    build.includes('scripts/sync-kb-sitemap.mjs'),
    'npm run build должен запускать scripts/sync-kb-sitemap.mjs',
  )
  assert.ok(
    build.indexOf('scripts/sync-kb-sitemap.mjs') < build.indexOf('vite build'),
    'синхронизация обязана идти до vite build — иначе в dist/ уедет старый sitemap.xml',
  )
})
