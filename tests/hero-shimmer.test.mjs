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
  const teaserBadge = heroSection.match(/<motion\.div\b[\s\S]*?className="[^"]*\bhero-shimmer-badge\b[\s\S]*?>/)
  const teaserSpan = heroSection.match(/<span\b[\s\S]*?>\s*Автоматизация без программистов\s*<\/span>/)

  assert.ok(teaserBadge, 'Expected the automation teaser pill to own the visible shimmer surface.')
  assert.match(teaserBadge[0], /data-active=\{isHeroTeaserActive \? 'true' : 'false'\}/)
  assert.match(teaserBadge[0], /data-shimmer=\{isHeroShimmerRunning \? 'true' : 'false'\}/)
  assert.ok(teaserSpan, 'Expected the automation teaser to remain a span')
  assert.match(teaserSpan[0], /hero-shimmer-trigger/)
  assert.match(teaserSpan[0], /\bopacity-100\b/)
  assert.match(teaserSpan[0], /data-active=\{isHeroTeaserActive \? 'true' : 'false'\}/)
  assert.match(teaserSpan[0], /data-shimmer=\{isHeroShimmerRunning \? 'true' : 'false'\}/)
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

test('automation teaser shimmer is scheduled at slow irregular intervals', () => {
  assert.match(homeSource, /const HERO_SHIMMER_MIN_DELAY_MS = 7000/)
  assert.match(homeSource, /const HERO_SHIMMER_MAX_DELAY_MS = 11000/)
  assert.match(homeSource, /const HERO_SHIMMER_SWEEP_MS = 4200/)
  assert.match(homeSource, /Math\.random\(\)/)
  assert.match(homeSource, /window\.setTimeout/)
  assert.match(homeSource, /setIsHeroShimmerRunning\(true\)/)
  assert.match(homeSource, /setIsHeroShimmerRunning\(false\)/)
})

test('automation teaser shimmer is a subtle slow light-blue sweep', () => {
  const badgeRule = cssSource.match(/\.hero-shimmer-badge\s*\{[\s\S]*?\n[ ]*\}/)
  const badgeActiveRule = cssSource.match(/\.hero-shimmer-badge\[data-active="true"\]\s*\{[\s\S]*?\n[ ]*\}/)
  const badgeShimmerRule = cssSource.match(/\.hero-shimmer-badge\[data-shimmer="true"\]::after\s*\{[\s\S]*?\n[ ]*\}/)
  const triggerRule = cssSource.match(/\.hero-shimmer-trigger\s*\{[\s\S]*?\n[ ]*\}/)
  const activeRule = cssSource.match(/\.hero-shimmer-trigger\[data-active="true"\]\s*\{[\s\S]*?\n[ ]*\}/)

  assert.ok(badgeRule, 'Expected the full teaser pill to have a dedicated shimmer surface.')
  assert.ok(badgeActiveRule, 'Expected hover to stay light and unobtrusive.')
  assert.ok(badgeShimmerRule, 'Expected the light-blue shimmer to cross the whole teaser pill.')
  assert.ok(triggerRule, 'Expected a dedicated shimmer trigger utility.')
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
  assert.match(cssSource, /@keyframes hero-shimmer-sweep/)
  assert.match(cssSource, /\.hero-shimmer-badge::after/)
  assert.match(cssSource, /rgba\(219,\s*234,\s*254,\s*0\.42\)/)
  assert.match(badgeShimmerRule[0], /animation:\s*hero-shimmer-sweep\s+4200ms\s+ease-in-out\s+both;/)
  assert.doesNotMatch(cssSource, /background-color:\s*rgba\(37,\s*99,\s*235,\s*0\.88\)/)
  assert.doesNotMatch(cssSource, /color:\s*#fff;/)
  assert.doesNotMatch(
    cssSource,
    /animation:\s*hero-shimmer-sweep\s+[^;]*\binfinite\b/,
    'The sweep should be launched by React at random intervals, not run as regular infinite CSS.',
  )
})
