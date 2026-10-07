// issue #644 — Вебмастер нашёл дубль главной integram.io/?Yd=ybiz2.
//
// Clean-param в robots.txt уже был (#563), но перечислял только «yd». Яндекс
// сравнивает имена параметров с учётом регистра, поэтому «Yd» директивой не
// покрывался и плодил копию главной. Тест держит оба написания и прежний
// набор рекламных параметров, чтобы следующая правка robots.txt их не потеряла.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = fileURLToPath(new URL('..', import.meta.url))
const robots = readFileSync(resolve(repo, 'integram.io/robots.txt'), 'utf8')

// Параметры всех строк Clean-param (без префикса пути), с учётом регистра.
const cleaned = new Set(
  [...robots.matchAll(/^\s*Clean-param:\s*(\S+)/gim)].flatMap((m) => m[1].split('&')),
)

test('Clean-param покрывает оба написания yd/Yd (#644)', () => {
  for (const p of ['yd', 'Yd']) {
    assert.ok(cleaned.has(p), `в Clean-param нет «${p}» — integram.io/?${p}=… снова станет дублем`)
  }
})

test('Clean-param сохраняет рекламные параметры из #563', () => {
  for (const p of ['ybaip', 'etext', 'from']) {
    assert.ok(cleaned.has(p), `в Clean-param пропал «${p}»`)
  }
})
