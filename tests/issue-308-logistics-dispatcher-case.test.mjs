import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

const postsDir = new URL('../blog-v2/src/content/posts/', import.meta.url)
const uploadsDir = new URL('../blog-v2/public/uploads/', import.meta.url)
const experimentsDir = new URL('../experiments/', import.meta.url)

const postFile = 'keis-logistika-dispetcher-otgruzok-iz-excel-za-den.md'
const heroImage = 'issue-308-logistics-dispatcher-dashboard.png'
const journalImage = 'issue-308-logistics-dispatcher-journal.png'

function png1200x630(name) {
  const bytes = readFileSync(new URL(name, uploadsDir))
  assert.equal(bytes.subarray(1, 4).toString('ascii'), 'PNG', `${name} should be a PNG`)
  assert.equal(bytes.readUInt32BE(16), 1200, `${name} width should be 1200`)
  assert.equal(bytes.readUInt32BE(20), 630, `${name} height should be 630`)
}

/**
 * Coverage for https://github.com/ideav/backlogram/issues/308 (A5.2):
 * the «Excel → приложение» success story for a logistics shipment dispatcher.
 * Locks in that the article is published, human-toned and ships both result
 * screenshots, mirroring the issue-288 V-Tech screenshot conventions.
 */
test('issue #308 publishes the logistics dispatcher case study', () => {
  const postPath = new URL(postFile, postsDir)
  assert.ok(existsSync(postPath), `expected ${postFile} to exist`)

  const post = readFileSync(postPath, 'utf8')

  // Frontmatter — published on the new blog (no canonical to the old one).
  assert.match(post, /title:\s*Как логистическая компания за день сделала диспетчера отгрузок из Excel/)
  assert.match(post, /pubDate:\s*['"]?2026-06-02['"]?/)
  assert.match(post, /category:\s*['"]?Проекты['"]?/)
  assert.match(post, /author:\s*['"]?Команда Интеграм['"]?/)
  assert.doesNotMatch(post, /^draft:\s*true/m)
  assert.doesNotMatch(post, /^canonical:/m, 'new article should use the new blog canonical URL')

  // Description contains ": " and therefore MUST stay quoted, otherwise YAML
  // parses it as a nested mapping and the article fails to render (issue #284).
  assert.match(post, /^description:\s*'.*Excel.*'$/m, 'description must be quoted (issue #284)')

  // The hero screenshot is wired through frontmatter and both result
  // screenshots are embedded in the body.
  assert.match(post, new RegExp(`^image:\\s*/uploads/${heroImage}$`, 'm'))
  assert.match(post, new RegExp(`!\\[[^\\]]*\\]\\(/uploads/${heroImage}\\)`))
  assert.match(post, new RegExp(`!\\[[^\\]]*\\]\\(/uploads/${journalImage}\\)`))

  // Human, not technical, story beats requested by the issue.
  assert.match(post, /диспетчер/i)
  assert.match(post, /Excel/)
  assert.match(post, /Сергей/, 'the story should follow a named human, not a spec')
  assert.match(post, /за день|к вечеру/, 'the story should land the «in a day» promise')
})

test('issue #308 ships both result screenshots as 1200×630 PNGs with sources', () => {
  png1200x630(heroImage)
  png1200x630(journalImage)

  const heroSource = readFileSync(new URL('issue-308-logistics-dispatcher-dashboard.html', experimentsDir), 'utf8')
  const journalSource = readFileSync(new URL('issue-308-logistics-dispatcher-journal.html', experimentsDir), 'utf8')

  for (const source of [heroSource, journalSource]) {
    assert.match(source, /ГрузЛайн/)
    // Same accent palette as the V-Tech screenshots (issue #288 / #292).
    assert.match(source, /--green:\s*#16a34a/)
    assert.match(source, /--amber:\s*#d97706/)
    assert.match(source, /--rose:\s*#e11d48/)
    assert.match(source, /--violet:\s*#7c3aed/)
  }

  assert.match(heroSource, /Пульт диспетчера отгрузок ГрузЛайн/)
  assert.match(journalSource, /Журнал отгрузок/)
})
