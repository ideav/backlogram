import assert from 'node:assert/strict'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { test } from 'node:test'

const homeSource = readFileSync(new URL('../src/pages/Home.tsx', import.meta.url), 'utf8')
const cssSource = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')
const backgroundUrl = '/hero-ai-background.webp'
const backgroundAsset = new URL('../public/hero-ai-background.webp', import.meta.url)

function getHeroSection(source) {
  const match = source.match(/\{\/\* 1\. Hero Section \*\/\}[\s\S]*?<section\b[\s\S]*?<\/section>/)
  assert.ok(match, 'Expected the first landing block hero section to exist')
  return match[0]
}

test('first landing block uses the issue image as a visibly flickering decorative background', () => {
  const heroSection = getHeroSection(homeSource)
  const flickerKeyframes = cssSource.match(/@keyframes hero-background-flicker\s*\{[\s\S]*?100%\s*\{[\s\S]*?\n\}/)

  assert.match(heroSection, new RegExp(`src="${backgroundUrl}"`))
  assert.match(heroSection, /alt=""/)
  assert.match(heroSection, /aria-hidden="true"/)
  assert.match(heroSection, /hero-background-flicker/)
  assert.match(heroSection, /data-active=\{isHeroTeaserActive \? 'true' : 'false'\}/)
  assert.ok(flickerKeyframes, 'Expected dedicated hero background flicker keyframes.')

  const opacityStops = [...flickerKeyframes[0].matchAll(/opacity:\s*(0?\.\d+|1(?:\.0+)?)/g)]
    .map(([, value]) => Number(value))
  const minOpacity = Math.min(...opacityStops)
  const maxOpacity = Math.max(...opacityStops)

  assert.ok(
    minOpacity <= 0.1,
    `Expected the background flicker to dip low enough to make the pulse visible; got ${minOpacity}.`,
  )
  assert.ok(
    maxOpacity >= 0.48,
    `Expected the background flicker amplitude to be noticeably stronger; got ${maxOpacity}.`,
  )
})

test('hero background asset is an optimized WebP file', () => {
  assert.ok(existsSync(backgroundAsset), 'Expected the hero background asset to be committed.')

  const header = readFileSync(backgroundAsset)
  const size = statSync(backgroundAsset).size

  assert.equal(header.toString('ascii', 0, 4), 'RIFF')
  assert.equal(header.toString('ascii', 8, 12), 'WEBP')
  assert.ok(size < 1_500_000, 'Hero background should remain lightweight for the landing page.')
})
