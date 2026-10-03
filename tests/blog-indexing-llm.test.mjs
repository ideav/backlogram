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

// Было: строка robots зашита в разметку шаблона, а слова «noindex» в файле нет
// вовсе. С issue #627 (п. 6) служебные страницы блога — поиск, 404 и страницы
// тегов с одной-двумя статьями — обязаны отдавать noindex, поэтому значение
// переехало в проп. Инвариант сохранён, но проверяется у значения по умолчанию:
// страница, которая ничего не передала, по-прежнему индексируется.
test('blog pages explicitly allow search indexing in the shared layout', () => {
  assert.match(baseLayoutSource, /<html lang="ru">/)
  assert.match(
    baseLayoutSource,
    /robots = 'index, follow, max-image-preview:large, max-snippet:-1',/,
  )
  assert.match(baseLayoutSource, /<meta\s+name="robots"\s+content=\{robots\}\s*\/?>/)
  // Единственное упоминание noindex в шаблоне — пояснение к пропу: сам шаблон
  // закрывать страницы от индекса не умеет, это делает вызывающая страница.
  const noindexLines = baseLayoutSource
    .split('\n')
    .filter((line) => /noindex|nofollow/.test(line))
  assert.deepEqual(
    noindexLines.map((l) => l.trim()),
    ["/** Содержимое <meta name=\"robots\">. 'noindex, follow' — для служебных страниц. */"],
  )
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

  assert.match(robotsSource, /Sitemap:\s*https:\/\/ideav\.ru\/blog\/sitemap-index\.xml/)
})

test('blog exposes an llms.txt route with the published post index', () => {
  assert.ok(existsSync(llmsRoute), 'expected blog-v2/src/pages/llms.txt.ts to exist')

  const routeSource = readFileSync(llmsRoute, 'utf8')
  assert.match(routeSource, /getCollection\('posts'/)
  assert.match(routeSource, /!data\.draft/)
  // Блог переехал в подпапку основного домена (issue #522).
  assert.match(routeSource, /https:\/\/ideav\.ru['"]/)
  assert.match(routeSource, /withBase/)
  assert.match(routeSource, /\/posts\/\$\{post\.id\}\//)
  assert.match(routeSource, /text\/plain;\s*charset=utf-8/)
})
