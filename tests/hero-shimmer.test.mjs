import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const homeSource = readFileSync(new URL('../src/pages/Home.tsx', import.meta.url), 'utf8')
const cssSource = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')

function getHeroSection(source) {
  const match = source.match(/\{\/\* 1\. Hero Section \*\/\}[\s\S]*?<section\b[\s\S]*?<\/section>/)
  assert.ok(match, 'Expected the first landing block hero section to exist')
  return match[0]
}

test('automation teaser span controls the hero opacity swap without fading itself', () => {
  const heroSection = getHeroSection(homeSource)
  const teaserSpan = heroSection.match(/<span\b[\s\S]*?>\s*Автоматизация без программистов\s*<\/span>/)

  assert.ok(teaserSpan, 'Expected the automation teaser to remain a span')
  assert.match(teaserSpan[0], /hero-shimmer-trigger/)
  assert.match(teaserSpan[0], /\bopacity-100\b/)
  assert.match(teaserSpan[0], /onMouseEnter=\{\(\) => setIsHeroTeaserActive\(true\)\}/)
  assert.match(teaserSpan[0], /onMouseLeave=\{\(\) => setIsHeroTeaserActive\(false\)\}/)

  assert.match(
    heroSection,
    /isHeroTeaserActive \? 'opacity-100 dark:opacity-100' : 'opacity-\[0\.10\] dark:opacity-\[0\.20\]'/,
    'Hovering the teaser should raise the decorative background to full opacity.',
  )
  assert.match(
    heroSection,
    /isHeroTeaserActive \? 'opacity-\[0\.10\] dark:opacity-\[0\.20\]' : 'opacity-100'/,
    'Hovering the teaser should fade the first block text to the background opacity.',
  )
  assert.match(heroSection, /transition-opacity duration-700 ease-in-out/)
})

test('automation teaser shimmer is a sweep effect that does not change span opacity', () => {
  const triggerRule = cssSource.match(/\.hero-shimmer-trigger\s*\{[\s\S]*?\n  \}/)

  assert.ok(triggerRule, 'Expected a dedicated shimmer trigger utility.')
  assert.doesNotMatch(
    triggerRule[0],
    /\bopacity\s*:/,
    'The teaser span should stay opaque; shimmer must not animate its opacity.',
  )
  assert.match(cssSource, /@keyframes hero-shimmer-sweep/)
  assert.match(cssSource, /\.hero-shimmer-trigger::after/)
})
