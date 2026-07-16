#!/usr/bin/env node
/**
 * Build guard: fail the build if dist/.htaccess is missing the platform front
 * controller.
 *
 * ideav.ru is served by ONE web root that hosts BOTH the marketing landing
 * (this repo) and the Интеграм platform engine (index.php, deployed from
 * ideav/crm). Vite copies public/.htaccess verbatim into dist/, and every
 * manual marketing deploy overwrites the web-root .htaccess with it. index.php
 * is NOT in this build, so if the shipped .htaccess ever drops the
 * `RewriteRule ^ index.php` front-controller line, every /<db>/... database URL
 * stops reaching the engine and the WHOLE platform goes offline.
 *
 * That is exactly what happened when a headers-only .htaccess shipped (issues
 * #422 / #423). This guard makes that class of incident impossible to build:
 * if the final artifact can't route the platform, `npm run build` exits non-zero
 * and never produces a deployable dist/.
 *
 * Runs LAST in the build chain (after vite build + all prerender steps) so it
 * validates the exact bytes that get uploaded.
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const htaccess = resolve(root, 'dist', '.htaccess')

/** Invariants the shipped .htaccess MUST satisfy to keep the platform routable. */
const REQUIRED = [
  {
    // mod_rewrite must be turned on or none of the RewriteRules below apply.
    test: /^\s*RewriteEngine\s+On/mi,
    what: 'RewriteEngine On',
  },
  {
    // The front controller itself. Anchored to line start (after optional
    // indent) so the descriptive `RewriteRule ^ index.php` inside the header
    // comment (which starts with `#`) does not count as a match.
    test: /^\s*RewriteRule\s+\^\s+index\.php/m,
    what: 'RewriteRule ^ index.php  (platform front controller — see issues #422/#423)',
  },
]

function fail(message) {
  console.error(`\n✖ verify-htaccess: ${message}`)
  console.error('  Refusing to ship a dist/.htaccess that would take the Интеграм')
  console.error('  platform offline. Fix public/.htaccess and rebuild.\n')
  process.exit(1)
}

if (!existsSync(htaccess)) {
  fail('dist/.htaccess does not exist — the front controller would not be deployed at all.')
}

const contents = readFileSync(htaccess, 'utf8')
const missing = REQUIRED.filter(rule => !rule.test.test(contents)).map(rule => rule.what)

if (missing.length > 0) {
  fail(`dist/.htaccess is missing required directive(s):\n    - ${missing.join('\n    - ')}`)
}

console.log('✓ verify-htaccess: dist/.htaccess carries the platform front controller.')
