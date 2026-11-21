// ideav/crm#5609: ссылка на другую страницу открывается в вкладке с именем этой
// страницы — основная вкладка не теряется, новые не плодятся.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { pageTarget, pageLinkProps, pageLinkAttrs } from '../src/data/pageTarget.mjs'
import { docsRingHtml } from '../src/data/docsRing.mjs'

test('имя вкладки = имя целевой страницы, якорь не влияет', () => {
  assert.equal(pageTarget('/api.html#schema-json', '/help.html'), 'api')
  assert.equal(pageTarget('/api.html#reports', '/help.html'), 'api')
  assert.equal(pageTarget('https://ideav.ru/api.html#x', '/help.html'), 'api')
  assert.equal(pageTarget('/knowledge-base/14b-dashboards', '/help.html'), 'knowledge-base/14b-dashboards')
  assert.equal(pageTarget('/', '/help.html'), 'index')
})

test('своя страница, якоря и не-http ссылки — без target', () => {
  assert.equal(pageTarget('#recipes-time-tracking', '/help.html'), null)
  assert.equal(pageTarget('/help.html#basics', '/help.html'), null)
  assert.equal(pageTarget('mailto:a@b.c', '/help.html'), null)
  assert.equal(pageTarget('tel:+7000', '/help.html'), null)
  assert.deepEqual(pageLinkProps('#x', '/help.html'), {})
  assert.equal(pageLinkAttrs('/help.html#x', '/help.html'), '')
})

test('чужой сайт — своя именованная вкладка и noopener', () => {
  assert.deepEqual(pageLinkProps('https://t.me/qdmadept', '/help.html'), { target: 't.me/qdmadept', rel: 'noopener' })
  assert.deepEqual(pageLinkProps('/api.html', '/help.html'), { target: 'api' })
  assert.equal(pageLinkAttrs('/api.html#a', '/help.html'), ' target="api"')
})

test('«См. также» в снапшоте несёт target, ссылка на себя не выводится', () => {
  const html = docsRingHtml('/help.html')
  assert.match(html, /<a href="\/api\.html" target="api">/)
  assert.doesNotMatch(html, /href="\/help\.html"/)
})

test('SPA и пререндер помощи подключают хелпер ко всем внешним ссылкам статей', () => {
  const tsx = readFileSync(new URL('../src/pages/HelpCenter.tsx', import.meta.url), 'utf8')
  assert.match(tsx, /<a href=\{l\.href\} \{\.\.\.pageLinkProps\(l\.href, HELP_META\.path\)\}/)
  const api = readFileSync(new URL('../src/pages/ApiDocs.tsx', import.meta.url), 'utf8')
  assert.match(api, /<a href=\{block\.link\.href\} \{\.\.\.pageLinkProps\(/)
  const see = readFileSync(new URL('../src/components/DocsSeeAlso.tsx', import.meta.url), 'utf8')
  assert.match(see, /\{\.\.\.pageLinkProps\(d\.href, path\)\}/)
  const pre = readFileSync(new URL('../scripts/prerender-help.mjs', import.meta.url), 'utf8')
  assert.equal((pre.match(/pageLinkAttrs\((?:b\.link|l)\.href, PATH\)/g) || []).length, 2)
})
