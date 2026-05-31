import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

const postsDir = new URL('../blog-v2/src/content/posts/', import.meta.url)
const uploadsDir = new URL('../blog-v2/public/uploads/', import.meta.url)
const experimentsDir = new URL('../experiments/', import.meta.url)

const imageSpecs = [
  {
    postFile: 'kak-dobavlyat-multissylki-zaprosom.md',
    imageFile: 'issue-292-v-tech-multilink-query.png',
    sourceFile: 'issue-292-v-tech-multilink-query.html',
    title: 'Цеховые мультиссылки В-Тех',
  },
  {
    postFile: 'bitrix24-ai-vibecode-i-sistemnaya-prostota.md',
    imageFile: 'issue-292-v-tech-ai-process-control.png',
    sourceFile: 'issue-292-v-tech-ai-process-control.html',
    title: 'Контроль логики В-Тех',
  },
  {
    postFile: 'prikladnoe-geo-optimizaciya-dlya-generativnyh-sistem.md',
    imageFile: 'issue-292-v-tech-geo-visibility.png',
    sourceFile: 'issue-292-v-tech-geo-visibility.html',
    title: 'GEO-мониторинг В-Тех',
  },
]

test('issue #292 replaces the next three recent abstract blog images with V-Tech screenshots', () => {
  for (const spec of imageSpecs) {
    const post = readFileSync(new URL(spec.postFile, postsDir), 'utf8')
    const imagePath = new URL(spec.imageFile, uploadsDir)
    const sourcePath = new URL(spec.sourceFile, experimentsDir)

    assert.match(
      post,
      new RegExp(`^image:\\s*/uploads/${spec.imageFile.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm'),
      `${spec.postFile} should use the generated V-Tech screenshot`,
    )
    assert.ok(existsSync(imagePath), `expected ${spec.imageFile} to exist`)
    assert.ok(existsSync(sourcePath), `expected ${spec.sourceFile} to exist`)

    const image = readFileSync(imagePath)
    assert.equal(image.subarray(1, 4).toString('ascii'), 'PNG')
    assert.equal(image.readUInt32BE(16), 1200)
    assert.equal(image.readUInt32BE(20), 630)

    const source = readFileSync(sourcePath, 'utf8')
    assert.match(source, /В-Тех/)
    assert.match(source, new RegExp(spec.title))
    assert.match(source, /--green:\s*#16a34a/)
    assert.match(source, /--amber:\s*#d97706/)
    assert.match(source, /--rose:\s*#e11d48/)
    assert.match(source, /--violet:\s*#7c3aed/)
  }
})
