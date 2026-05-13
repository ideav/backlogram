import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const kbPageSource = readFileSync(
  new URL('../src/pages/KnowledgeBase.tsx', import.meta.url),
  'utf8',
)

const kbArticlePage = readFileSync(
  new URL('../src/pages/KnowledgeBaseArticle.tsx', import.meta.url),
  'utf8',
)

test('article page exposes a setJsonLd helper that creates an application/ld+json script tag', () => {
  assert.match(kbArticlePage, /function setJsonLd\(/)
  assert.match(kbArticlePage, /application\/ld\+json/)
  assert.match(kbArticlePage, /data-jsonld=/)
  assert.match(kbArticlePage, /JSON\.stringify\(data\)/)
})

test('article page injects an Article JSON-LD with key Schema.org fields', () => {
  assert.match(kbArticlePage, /setJsonLd\('article',/)
  assert.match(kbArticlePage, /'@context': 'https:\/\/schema\.org'/)
  assert.match(kbArticlePage, /'@type': 'Article'/)
  assert.match(kbArticlePage, /headline: article\.title/)
  assert.match(kbArticlePage, /description,/)
  assert.match(kbArticlePage, /inLanguage: 'ru-RU'/)
  assert.match(kbArticlePage, /url: canonicalUrl/)
  assert.match(kbArticlePage, /mainEntityOfPage:/)
  assert.match(kbArticlePage, /publisher:/)
  assert.match(kbArticlePage, /author:/)
})

test('article page injects a BreadcrumbList JSON-LD with three positions', () => {
  assert.match(kbArticlePage, /setJsonLd\('breadcrumb',/)
  assert.match(kbArticlePage, /'@type': 'BreadcrumbList'/)
  assert.match(kbArticlePage, /position: 1/)
  assert.match(kbArticlePage, /position: 2/)
  assert.match(kbArticlePage, /position: 3/)
  assert.match(kbArticlePage, /name: 'База знаний'/)
  assert.match(kbArticlePage, /name: article\.shortTitle/)
})

test('knowledge base index page injects a CollectionPage JSON-LD with an ItemList of articles', () => {
  assert.match(kbPageSource, /function setJsonLd\(/)
  assert.match(kbPageSource, /setJsonLd\('collection',/)
  assert.match(kbPageSource, /'@type': 'CollectionPage'/)
  assert.match(kbPageSource, /'@type': 'ItemList'/)
  assert.match(kbPageSource, /numberOfItems: knowledgeBaseArticles\.length/)
  assert.match(kbPageSource, /knowledgeBaseArticles\.map/)
  assert.match(kbPageSource, /'@type': 'ListItem'/)
})

test('knowledge base index page injects a BreadcrumbList JSON-LD with two positions', () => {
  assert.match(kbPageSource, /setJsonLd\('breadcrumb',/)
  assert.match(kbPageSource, /'@type': 'BreadcrumbList'/)
  assert.match(kbPageSource, /position: 1/)
  assert.match(kbPageSource, /position: 2/)
  assert.match(kbPageSource, /name: 'База знаний'/)
})

test('knowledge base pages clear previous JSON-LD on (re)mount to avoid stale entries during SPA navigation', () => {
  assert.match(kbArticlePage, /function clearJsonLd\(/)
  assert.match(kbArticlePage, /script\[type="application\/ld\+json"\]\[data-jsonld\]/)
  assert.match(kbArticlePage, /return clearJsonLd/)
  assert.match(kbPageSource, /function clearJsonLd\(/)
  assert.match(kbPageSource, /script\[type="application\/ld\+json"\]\[data-jsonld\]/)
  assert.match(kbPageSource, /return clearJsonLd/)
})
