import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const kbPageSource = readFileSync(
  new URL('../src/pages/KnowledgeBase.tsx', import.meta.url),
  'utf8',
)

const robotsSource = readFileSync(
  new URL('../public/robots.txt', import.meta.url),
  'utf8',
)

test('knowledge base page sets SEO meta title, description and keywords', () => {
  assert.match(kbPageSource, /KB_SEO_TITLE/)
  assert.match(kbPageSource, /KB_SEO_DESCRIPTION/)
  assert.match(kbPageSource, /KB_SEO_KEYWORDS/)
  assert.match(kbPageSource, /setMetaTag\(/)
  assert.match(kbPageSource, /'description'/)
  assert.match(kbPageSource, /'keywords'/)
  assert.match(kbPageSource, /База знаний — Интеграм/)
})

test('knowledge base page sets Open Graph and Twitter Card meta tags', () => {
  assert.match(kbPageSource, /og:title/)
  assert.match(kbPageSource, /og:description/)
  assert.match(kbPageSource, /og:type/)
  assert.match(kbPageSource, /og:site_name/)
  assert.match(kbPageSource, /og:locale/)
  assert.match(kbPageSource, /twitter:card/)
  assert.match(kbPageSource, /twitter:title/)
  assert.match(kbPageSource, /twitter:description/)
})

test('knowledge base page sets canonical link', () => {
  assert.match(kbPageSource, /setCanonical\(/)
  assert.match(kbPageSource, /knowledge-base\.html/)
})

test('knowledge base page sets robots meta tag to index, follow', () => {
  assert.match(kbPageSource, /index, follow/)
})

test('knowledge base page renders a search input', () => {
  assert.match(kbPageSource, /type="search"/)
  assert.match(kbPageSource, /Поиск по базе знаний/)
  assert.match(kbPageSource, /aria-label="Поиск по базе знаний"/)
})

test('knowledge base page filters articles by query using matchesQuery', () => {
  assert.match(kbPageSource, /matchesQuery/)
  assert.match(kbPageSource, /split\(\/\\s\+\/\)\.filter\(Boolean\)/)
  assert.match(kbPageSource, /words\.every\(\(word\) => haystack\.includes\(word\)\)/)
})

test('knowledge base page shows empty-state message when search has no results', () => {
  assert.match(kbPageSource, /не найдено/)
})

test('knowledge base page shows a clear button when the query is non-empty', () => {
  assert.match(kbPageSource, /Очистить поиск/)
  assert.match(kbPageSource, /setQuery\(''\)/)
})

test('robots.txt allows crawling of knowledge-base routes', () => {
  assert.match(robotsSource, /User-agent: \*\nAllow: \//)
  assert.doesNotMatch(robotsSource, /Disallow: \/knowledge-base/)
})
