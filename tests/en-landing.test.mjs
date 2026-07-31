import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// The English site on ideav.pro must not look like a Russian site with English
// text on top: no Cyrillic, no links to .ru hosts, no Yandex services (issue
// #524). These checks run over the sources, so they do not need a build.

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const siteEn = join(root, 'site-en')

const CYRILLIC = /[Ѐ-ӿ]/

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

const files = walk(siteEn).filter((f) => /\.(tsx?|css|html|php|txt|xml)$/.test(f))

test('site-en sources contain no Cyrillic', () => {
  const offenders = files.filter((f) => CYRILLIC.test(readFileSync(f, 'utf8')))
  assert.deepEqual(
    offenders.map((f) => f.replace(root + '/', '')),
    [],
    'Cyrillic found — English site text, comments and markup must be Latin only',
  )
})

test('site-en links to no .ru host and no Yandex service', () => {
  const banned = [/https?:\/\/[a-z0-9.-]+\.ru\b/i, /mc\.yandex/i, /smartcaptcha/i, /rutube/i]
  const offenders = []
  for (const file of files) {
    const text = readFileSync(file, 'utf8')
    for (const pattern of banned) {
      if (pattern.test(text)) offenders.push(`${file.replace(root + '/', '')} → ${pattern}`)
    }
  }
  assert.deepEqual(offenders, [], 'the English site must not point at Russian hosts')
})

test('the English entry page declares English and its own canonical', () => {
  const html = readFileSync(join(siteEn, 'index.html'), 'utf8')
  assert.match(html, /<html lang="en">/)
  assert.match(html, /<link rel="canonical" href="https:\/\/ideav\.pro\/" \/>/)
  assert.ok(!html.includes('metrika'), 'no Yandex.Metrika counter on the English site')
})

test('the English build does not ship the ideav.ru front controller', () => {
  // public/.htaccess in the repo root routes every non-file path to index.php
  // for the Интеграм engine. There is no engine on ideav.pro, so that file must
  // stay out of site-en/public (issue #422 is the cautionary tale).
  const publicFiles = readdirSync(join(siteEn, 'public'))
  assert.ok(!publicFiles.includes('.htaccess'), 'site-en/public must not carry an .htaccess')
})
