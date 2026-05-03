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

test('first landing block uses the issue image as a subtle decorative background', () => {
  const heroSection = getHeroSection(homeSource)

  assert.match(heroSection, new RegExp(`src="${backgroundUrl}"`))
  assert.match(heroSection, /alt=""/)
  assert.match(heroSection, /aria-hidden="true"/)
  assert.match(heroSection, /hero-background-flicker/)
  assert.match(heroSection, /data-active=\{isHeroTeaserActive \? 'true' : 'false'\}/)
  assert.match(
    cssSource,
    /@keyframes hero-background-flicker[\s\S]*?opacity:\s*0\.(?:1[0-9]|2[0-9])/,
    'The background flicker should stay subtle enough for the hero copy to remain readable.',
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
