// issue #905, п. 2 — даты публикации и изменения со временем и поясом Москвы.
//
// Во фронтматтере pubDate/updatedDate бывают «только днём» ('2026-10-20')
// или реальным моментом выкладки ('2026-11-07T21:37:11+03:00'). Наружу день
// уходит чистой датой, момент — с тем же поясом +03:00, а не пересчитанным
// в Z. dateModified ставится только после содержательной правки.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { humanDate, isDayOnly, machineDate } from '../blog-v2/src/lib/dates.mjs'
import { dayOf, isPublished } from '../blog-v2/src/lib/published.mjs'

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8')

test('a day-only date stays a plain date', () => {
  const d = new Date('2026-10-20')
  assert.equal(isDayOnly(d), true)
  assert.equal(machineDate(d), '2026-10-20')
  assert.equal(humanDate(d), '20 октября 2026')
})

test('a moment keeps its Moscow time and offset', () => {
  const d = new Date('2026-11-07T21:37:11+03:00')
  assert.equal(isDayOnly(d), false)
  assert.equal(machineDate(d), '2026-11-07T21:37:11+03:00')
  assert.equal(humanDate(d), '07 ноября 2026')
})

test('a night moment belongs to its Moscow day, not to yesterday in UTC', () => {
  const d = new Date('2026-11-08T01:30:00+03:00')
  assert.equal(machineDate(d), '2026-11-08T01:30:00+03:00')
  assert.equal(humanDate(d), '08 ноября 2026')
  assert.equal(dayOf(d), '2026-11-08')
  assert.equal(dayOf('2026-11-08T01:30:00+03:00'), '2026-11-08')
  assert.equal(isPublished({ pubDate: '2026-11-08T01:30:00+03:00' }, '2026-11-07'), false)
  assert.equal(isPublished({ pubDate: '2026-11-08T01:30:00+03:00' }, '2026-11-08'), true)
  assert.equal(dayOf(new Date('2026-10-20')), '2026-10-20')
})

test('the Lean post carries real publication and edit times', () => {
  const post = read('../blog-v2/src/content/posts/berezhlivoe-proizvodstvo-lean-instrumenty.md')
  // публикация — мерж #896 (выложен сразу); правка — последний содержательный
  // мерж: #902 (пост и КБ №35 разведены, после #899 и #900)
  assert.match(post, /^pubDate: '2026-11-07T21:37:11\+03:00'$/m)
  assert.match(post, /^updatedDate: '2026-11-07T23:39:52\+03:00'$/m)
})

test('post page shows «Обновлено» only for a real edit on another day', () => {
  const page = read('../blog-v2/src/pages/posts/[...slug].astro')
  assert.match(page, /const formattedDate = humanDate\(post\.data\.pubDate\)/)
  assert.match(page, /formattedUpdated && formattedUpdated !== formattedDate/)
  assert.match(page, /Обновлено <time datetime=\{updated\}>/)
  for (const f of ['index.astro', 'category/[slug].astro', 'tag/[slug].astro']) {
    const src = read(`../blog-v2/src/pages/${f}`)
    assert.doesNotMatch(src, /timeZone: 'UTC'/, `${f} formats dates by Moscow`)
  }
})
