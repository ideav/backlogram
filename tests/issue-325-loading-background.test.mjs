import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

// Regression coverage for issue #325 — "Опять чёрный фон во время загрузки"
// (a black background flashes during page load again).
//
// Root cause: the theme design tokens were declared with `@theme dark { ... }`,
// which Tailwind merges straight into `:root`. The dark `--color-background`
// therefore overrode the light one unconditionally, so
// `body { background-color: var(--color-background) }` was dark for EVERY visitor
// until React mounted its `bg-white` wrapper — a black screen during loading,
// regardless of the chosen theme. A secondary mismatch lived in the prerendered
// SEO fallbacks, whose dark colours keyed off `@media (prefers-color-scheme: dark)`
// (the OS setting) instead of the `.dark` class that actually drives the app theme.
//
// Both must follow the same signal: the `.dark` class on <html>, added
// synchronously by the inline <head> script from localStorage before first paint.

// Strip CSS comments so prose that mentions `@theme dark` (the very pattern we
// forbid, named in an explanatory comment) doesn't trip the structural checks.
const cssSource = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8').replace(
  /\/\*[\s\S]*?\*\//g,
  '',
)

const prerenderScripts = [
  { name: 'prerender-landing.mjs', id: 'lp-prerender' },
  { name: 'prerender-excel-to-app.mjs', id: 'etl-prerender' },
  { name: 'prerender-knowledge-base.mjs', id: 'kb-prerender' },
]

test('dark design tokens are scoped to the .dark class, not merged into :root', () => {
  assert.doesNotMatch(
    cssSource,
    /@theme\s+dark\b/,
    '`@theme dark` is merged into :root by Tailwind, making --color-background dark for everyone',
  )

  // Light default still lives in the global @theme block.
  assert.match(
    cssSource,
    /@theme\s*\{[\s\S]*--color-background:\s*oklch\(100%/,
    'light --color-background must remain the :root default',
  )

  // Dark palette is applied through a `.dark` selector so it only wins when the
  // theme class is present on <html>.
  const darkBlock = cssSource.match(/\.dark\s*\{[\s\S]*?--color-background:\s*oklch\(9%[\s\S]*?\}/)
  assert.ok(
    darkBlock,
    'dark --color-background must be defined under a `.dark` selector',
  )
})

test('body background follows a theme token rather than a hard-coded dark colour', () => {
  assert.match(
    cssSource,
    /body\s*\{[\s\S]*background-color:\s*var\(--color-background\)/,
    'body background should resolve from the (now theme-aware) --color-background token',
  )
})

for (const { name, id } of prerenderScripts) {
  test(`${name} themes its fallback via the .dark class, not prefers-color-scheme`, () => {
    const source = readFileSync(new URL(`../scripts/${name}`, import.meta.url), 'utf8')

    assert.doesNotMatch(
      source,
      /@media\s*\(\s*prefers-color-scheme:\s*dark\s*\)/,
      `${name} must not theme its fallback from the OS color scheme`,
    )

    assert.match(
      source,
      new RegExp(`\\.dark\\s+#${id}\\b`),
      `${name} dark fallback colours must be keyed on the .dark class`,
    )
  })
}
