import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const POSTS_DIR = join(__dirname, '..', 'blog-v2', 'src', 'content', 'posts')

/**
 * Regression coverage for https://github.com/ideav/backlogram/issues/284
 *
 * An unquoted YAML scalar that contains a ": " (colon followed by whitespace)
 * is interpreted by the YAML parser as a nested mapping, producing:
 *   "Error in user YAML: (<unknown>): mapping values are not allowed in this
 *    context at line 2 column 80"
 * The frontmatter is handed to the parser without the leading `---`, so the
 * parser numbers `title` as line 1 and `description` as line 2 — which is why
 * the report points at "line 2".
 */

function listPosts() {
  return readdirSync(POSTS_DIR)
    .filter((name) => name.endsWith('.md'))
    .map((name) => join(POSTS_DIR, name))
}

function extractFrontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  return match ? match[1] : null
}

// Try to load a real YAML parser the same way the site's toolchain would.
async function loadYamlParser() {
  for (const mod of ['yaml', 'js-yaml']) {
    try {
      const m = await import(mod)
      if (mod === 'yaml') return (text) => (m.parse ?? m.default.parse)(text)
      const load = m.load ?? m.default.load
      return (text) => load(text)
    } catch {
      /* not installed in this workspace, try the next one */
    }
  }
  return null
}

/**
 * Dependency-free detector for the exact bug class from issue #284:
 * a top-level, unquoted frontmatter value that contains ": " (or ends with
 * ":"), which the YAML spec rejects as an ambiguous mapping.
 */
function findUnquotedColonScalars(frontmatter) {
  const problems = []
  const lines = frontmatter.split(/\r?\n/)
  lines.forEach((line, index) => {
    const m = line.match(/^([A-Za-z0-9_-]+):\s+(.*)$/)
    if (!m) return
    const value = m[2]
    if (value === '') return
    const first = value[0]
    // Quoted, block, or flow scalars are safe.
    if (first === '"' || first === "'" || first === '|' || first === '>' || first === '[' || first === '{') return
    if (/:(\s|$)/.test(value)) {
      problems.push({ line: index + 1, key: m[1], value })
    }
  })
  return problems
}

const posts = listPosts()

test('blog-v2 posts have at least one markdown file', () => {
  assert.ok(posts.length > 0, `expected markdown posts in ${POSTS_DIR}`)
})

test('every post has a frontmatter block', () => {
  for (const file of posts) {
    const fm = extractFrontmatter(readFileSync(file, 'utf8'))
    assert.ok(fm !== null, `missing frontmatter in ${file}`)
  }
})

test('no post has an unquoted scalar containing a colon (issue #284)', () => {
  const failures = []
  for (const file of posts) {
    const fm = extractFrontmatter(readFileSync(file, 'utf8'))
    if (fm === null) continue
    for (const p of findUnquotedColonScalars(fm)) {
      failures.push(`${file}: ${p.key} (frontmatter line ${p.line}) -> ${p.value}`)
    }
  }
  assert.equal(
    failures.length,
    0,
    `unquoted YAML scalars with a colon will break the build:\n${failures.join('\n')}`,
  )
})

test('every post frontmatter parses as valid YAML', async () => {
  const parse = await loadYamlParser()
  if (!parse) {
    // No YAML parser available in this workspace; the lint test above already
    // guards the issue #284 bug class without external dependencies.
    return
  }
  for (const file of posts) {
    const fm = extractFrontmatter(readFileSync(file, 'utf8'))
    if (fm === null) continue
    assert.doesNotThrow(() => parse(fm), `invalid YAML frontmatter in ${file}`)
  }
})
