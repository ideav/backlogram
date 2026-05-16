import assert from 'node:assert/strict'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { test } from 'node:test'

const experimentPath = new URL('../experiments/issue-246-blog-alternatives.html', import.meta.url)
const reviewPath = new URL('../docs/issue-246-blog-design-alternatives.md', import.meta.url)

const screenshots = [
  'issue-246-blog-alt-01-product-newsroom.png',
  'issue-246-blog-alt-02-knowledge-hub.png',
  'issue-246-blog-alt-03-executive-digest.png',
]

test('issue 246 includes three modern blog design alternatives', () => {
  assert.ok(existsSync(experimentPath), 'expected the reproducible HTML design study to exist')
  assert.ok(existsSync(reviewPath), 'expected the review note with embedded screenshots to exist')

  const experiment = readFileSync(experimentPath, 'utf8')
  const review = readFileSync(reviewPath, 'utf8')

  assert.match(experiment, /data-screenshot="product-newsroom"/)
  assert.match(experiment, /data-screenshot="knowledge-hub"/)
  assert.match(experiment, /data-screenshot="executive-digest"/)
  assert.doesNotMatch(experiment, /Fraunces|paper grain|drop cap/i)

  for (const screenshot of screenshots) {
    const screenshotPath = new URL(`../docs/screenshots/${screenshot}`, import.meta.url)
    assert.ok(existsSync(screenshotPath), `expected ${screenshot} to be committed`)
    assert.ok(statSync(screenshotPath).size > 50_000, `${screenshot} should be a rendered PNG, not a placeholder`)
    assert.match(review, new RegExp(`docs/screenshots/${screenshot}`))
  }
})
