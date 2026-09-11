import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// fileURLToPath, а не .pathname: pathname у file-URL на Windows даёт «C:\C:\…».
const repo = fileURLToPath(new URL('..', import.meta.url))
const read = (p) => readFileSync(resolve(repo, p), 'utf8')

const headerSource = read('src/components/Header.tsx')

// Мобильное меню — блок после id="mobile-nav" (issue #572: семь крупных пунктов +
// «Ещё» выталкивали кнопку «Войти» за нижний край экрана, а сам блок не скроллился —
// кнопка была недостижима).
function mobileNavBlock() {
  const start = headerSource.indexOf('id="mobile-nav"')
  assert.ok(start !== -1, 'Header should mark the mobile navigation with id="mobile-nav"')
  return headerSource.slice(start)
}

test('mobile menu: «Войти» stands before the nav links, not below the fold', () => {
  const block = mobileNavBlock()
  const login = block.indexOf('Войти')
  const links = block.indexOf('{navLinks.map')
  assert.ok(login !== -1, 'mobile nav should contain the «Войти» button')
  assert.ok(links !== -1, 'mobile nav should render navLinks')
  assert.ok(
    login < links,
    '«Войти» must come before the nav links so it is visible without scrolling (issue #572)',
  )
})

test('mobile menu scrolls within the viewport as a safety net', () => {
  const block = mobileNavBlock()
  assert.match(
    block,
    /max-h-\[calc\(100dvh-4rem\)\][^"]*overflow-y-auto|overflow-y-auto[^"]*max-h-\[calc\(100dvh-4rem\)\]/,
    'mobile nav container should cap its height to the viewport (minus the h-16 header) and scroll (issue #572)',
  )
})

test('mobile menu keeps a single «Войти» button', () => {
  // Считаем только JSX-текст кнопки (строка из одного слова), не комментарии.
  const block = mobileNavBlock()
  const count = (block.match(/^\s*Войти\s*$/gm) || []).length
  assert.equal(count, 1, 'exactly one «Войти» button in the mobile nav')
})
