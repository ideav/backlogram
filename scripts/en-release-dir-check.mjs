#!/usr/bin/env node
// Pre-upload check used by scripts/en-deploy.sh: scans an assembled release dir
// with the same rules as the build guard. Usage: node scripts/en-release-dir-check.mjs <dir>
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { scanText, isAllowed, looksLikeText } from './lib/en-guard-rules.mjs'

const dir = path.resolve(process.argv[2] ?? '')
if (!process.argv[2] || !fs.existsSync(dir)) {
  console.error('usage: en-release-dir-check.mjs <dir>')
  process.exit(2)
}
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const allowlist = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests', 'en-guard-allowlist.json'), 'utf8'))

// Release paths are relative to the engine root, allowlist paths carry the engine/ prefix (as in en-engine.test.mjs): check both.
const problems = []
;(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name)
    if (e.isDirectory()) { if (e.name !== 'node_modules') walk(f); continue }
    const rel = path.relative(dir, f).split(path.sep).join('/')
    const buf = fs.readFileSync(f)
    if (!looksLikeText(rel, buf)) continue
    for (const x of scanText(buf.toString('utf8'))) {
      if (!isAllowed(allowlist, rel, x) && !isAllowed(allowlist, 'engine/' + rel, x)) problems.push(`${rel}:${x.line}:${x.col} [${x.rule}] ${x.match}`)
    }
  }
})(dir)

if (problems.length) {
  console.error(`Release dir has ${problems.length} Russian trace(s); deploy aborted:`)
  console.error(problems.slice(0, 30).join('\n'))
  process.exit(1)
}
console.log('release dir clean')
