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

test('automation teaser span reveals the hero background without owning automatic shimmer', () => {
  const heroSection = getHeroSection(homeSource)
  const backgroundLayer = heroSection.match(/<div\b[\s\S]*?className="[^"]*\bhero-background-flicker\b[\s\S]*?>/)
  const teaserBadge = heroSection.match(/<motion\.div\b[\s\S]*?className="[^"]*\bhero-teaser-badge\b[\s\S]*?>/)
  const teaserSpan = heroSection.match(/<span\b[\s\S]*?>\s*Автоматизация без программистов\s*<\/span>/)

  assert.ok(backgroundLayer, 'Expected the hero background layer to own the automatic flicker surface.')
  assert.match(backgroundLayer[0], /data-active=\{isHeroTeaserActive \? 'true' : 'false'\}/)
  assert.ok(teaserBadge, 'Expected a dedicated automation teaser pill.')
  assert.match(teaserBadge[0], /data-active=\{isHeroTeaserActive \? 'true' : 'false'\}/)
  assert.doesNotMatch(teaserBadge[0], /data-shimmer=/)
  assert.ok(teaserSpan, 'Expected the automation teaser to remain a span')
  assert.match(teaserSpan[0], /hero-teaser-trigger/)
  assert.match(teaserSpan[0], /\bopacity-100\b/)
  assert.match(teaserSpan[0], /data-active=\{isHeroTeaserActive \? 'true' : 'false'\}/)
  assert.doesNotMatch(teaserSpan[0], /data-shimmer=/)
  assert.match(teaserSpan[0], /onMouseEnter=\{\(\) => setIsHeroTeaserActive\(true\)\}/)
  assert.match(teaserSpan[0], /onMouseLeave=\{\(\) => setIsHeroTeaserActive\(false\)\}/)

  assert.match(
    heroSection,
    /isHeroTeaserActive \? 'opacity-\[0\.10\] dark:opacity-\[0\.20\]' : 'opacity-100'/,
    'Hovering the teaser should fade the first block text to the background opacity.',
  )
  assert.match(heroSection, /transition-opacity duration-700 ease-in-out/)
})

test('hero background flicker is a slow light-blue cycle', () => {
  const backgroundRule = cssSource.match(/\.hero-background-flicker\s*\{[\s\S]*?\n[ ]*\}/)
  const backgroundTintRule = cssSource.match(/\.hero-background-flicker::after\s*\{[\s\S]*?\n[ ]*\}/)
  const backgroundActiveRule = cssSource.match(/\.hero-background-flicker\[data-active="true"\]\s*\{[\s\S]*?\n[ ]*\}/)

  assert.ok(backgroundRule, 'Expected a dedicated hero background flicker utility.')
  assert.ok(backgroundTintRule, 'Expected a dedicated light-blue tint on the flickering background.')
  assert.ok(backgroundActiveRule, 'Expected hover to pause flicker while revealing the background.')
  assert.match(cssSource, /@keyframes hero-background-flicker/)
  assert.match(backgroundRule[0], /animation:\s*hero-background-flicker\s+9000ms\s+ease-in-out\s+infinite;/)
  assert.match(backgroundTintRule[0], /rgba\(219,\s*234,\s*254,\s*0\.\d+\)/)
  assert.match(backgroundTintRule[0], /rgba\(239,\s*246,\s*255,\s*0\.\d+\)/)
  assert.match(backgroundActiveRule[0], /animation:\s*none;/)
  assert.match(backgroundActiveRule[0], /opacity:\s*1;/)

  assert.doesNotMatch(homeSource, /HERO_SHIMMER/)
  assert.doesNotMatch(homeSource, /isHeroShimmerRunning/)
  assert.doesNotMatch(homeSource, /data-shimmer=/)
})

test('automation teaser keeps a light contrast state without flickering text', () => {
  const badgeRule = cssSource.match(/\.hero-teaser-badge\s*\{[\s\S]*?\n[ ]*\}/)
  const badgeActiveRule = cssSource.match(/\.hero-teaser-badge\[data-active="true"\]\s*\{[\s\S]*?\n[ ]*\}/)
  const triggerRule = cssSource.match(/\.hero-teaser-trigger\s*\{[\s\S]*?\n[ ]*\}/)
  const activeRule = cssSource.match(/\.hero-teaser-trigger\[data-active="true"\]\s*\{[\s\S]*?\n[ ]*\}/)

  assert.ok(badgeRule, 'Expected the full teaser pill to have a dedicated surface.')
  assert.ok(badgeActiveRule, 'Expected hover to stay light and unobtrusive.')
  assert.ok(triggerRule, 'Expected a dedicated teaser trigger utility.')
  assert.ok(activeRule, 'Expected the active teaser state to have a dedicated rule.')
  assert.doesNotMatch(
    triggerRule[0],
    /\bopacity\s*:/,
    'The teaser span should stay opaque; shimmer must not animate its opacity.',
  )
  assert.match(badgeActiveRule[0], /background-color:\s*rgba\(219,\s*234,\s*254,\s*0\.28\)(?:\s*!important)?;/)
  assert.match(badgeActiveRule[0], /border-color:\s*rgba\(147,\s*197,\s*253,\s*0\.55\);/)
  assert.match(badgeActiveRule[0], /box-shadow:/)
  assert.match(activeRule[0], /color:\s*rgb\(37,\s*99,\s*235\);/)
  assert.doesNotMatch(cssSource, /@keyframes hero-shimmer-sweep/)
  assert.doesNotMatch(cssSource, /\.hero-shimmer-badge/)
  assert.doesNotMatch(cssSource, /\.hero-teaser-badge::after/)
  assert.doesNotMatch(cssSource, /background-color:\s*rgba\(37,\s*99,\s*235,\s*0\.88\)/)
  assert.doesNotMatch(cssSource, /color:\s*#fff;/)
})
