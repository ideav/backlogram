import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

const baseLayoutSource = readFileSync(
  new URL('../blog-v2/src/layouts/BaseLayout.astro', import.meta.url),
  'utf8',
)

const robotsSource = readFileSync(
  new URL('../blog-v2/public/robots.txt', import.meta.url),
  'utf8',
)

const llmsRoute = new URL('../blog-v2/src/pages/llms.txt.ts', import.meta.url)

function agentAllowPattern(agent) {
  const escapedAgent = agent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`User-agent:\\s*${escapedAgent}\\s*\\nAllow:\\s*/`, 'i')
}

test('blog pages explicitly allow search indexing in the shared layout', () => {
  assert.match(baseLayoutSource, /<html lang="ru">/)
  assert.match(
    baseLayoutSource,
    /<meta\s+name="robots"\s+content="index, follow, max-image-preview:large, max-snippet:-1"\s*\/?>/,
  )
  assert.doesNotMatch(baseLayoutSource, /noindex|nofollow/)
})

test('blog robots.txt allows search engines and LLM crawlers', () => {
  assert.match(robotsSource, /User-agent:\s*\*\s*\nAllow:\s*\//)
  assert.doesNotMatch(robotsSource, /Disallow:\s*\/\s*(?:\n|$)/)

  for (const agent of [
    'GPTBot',
    'ClaudeBot',
    'Google-Extended',
    'CCBot',
    'ChatGPT-User',
    'OAI-SearchBot',
    'Claude-SearchBot',
    'PerplexityBot',
    'Googlebot',
    'YandexBot',
    'Bingbot',
  ]) {
    assert.match(robotsSource, agentAllowPattern(agent))
  }

  assert.match(robotsSource, /Sitemap:\s*https:\/\/blog\.ideav\.ru\/sitemap-index\.xml/)
})

test('blog exposes an llms.txt route with the published post index', () => {
  assert.ok(existsSync(llmsRoute), 'expected blog-v2/src/pages/llms.txt.ts to exist')

  const routeSource = readFileSync(llmsRoute, 'utf8')
  assert.match(routeSource, /getCollection\('posts'/)
  assert.match(routeSource, /!data\.draft/)
  assert.match(routeSource, /blog\.ideav\.ru/)
  assert.match(routeSource, /\/posts\/\$\{post\.id\}\//)
  assert.match(routeSource, /text\/plain;\s*charset=utf-8/)
})
