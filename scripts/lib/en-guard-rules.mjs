// Shared content rules for the English site (integram-ai.online): used by the build
// guard (tests/en-dist.test.mjs) and by the live audit (scripts/en-release-audit.mjs).
// Epic #524, issues #535 / #536.

/** Each rule: name, regex (global), human description. */
export const RULES = [
  { name: 'cyrillic', re: /[Ѐ-ԯ]+/g, hint: 'Cyrillic character' },
  { name: 'ru-host', re: /(?:[a-z0-9-]+\.)+ru(?![a-z0-9_-])/gi, hint: '*.ru host' },
  { name: 'yandex', re: /yandex/gi, hint: 'Yandex (Metrika, SmartCaptcha, OAuth, Direct)' },
  { name: 'smartcaptcha', re: /smartcaptcha/gi, hint: 'SmartCaptcha' },
  { name: 'rutube', re: /rutube/gi, hint: 'RUTUBE' },
  { name: 'telegram-channel', re: /t\.me\/qdmadept/gi, hint: 'Telegram channel qdmadept' },
  { name: 'ruble', re: /₽/g, hint: 'ruble sign' },
  { name: 'phone-ru', re: /\+7[\s(\- ]/g, hint: '+7 phone pattern' },
  { name: 'vk', re: /(?:^|[^a-z0-9-])vk\.com/gi, hint: 'vk.com' },
  { name: '152-fz', re: /152[\s -]*(?:FZ|ФЗ)/gi, hint: '152-FZ' },
  { name: 'registry-30872', re: /(?<![\w.#-])30872(?![\w-])/g, hint: 'software registry entry 30872' },
]

/** Returns [{rule, hint, match, line, col}] for every violation in text. */
export function scanText(text) {
  const out = []
  for (const rule of RULES) {
    rule.re.lastIndex = 0
    let m
    while ((m = rule.re.exec(text)) !== null) {
      const before = text.slice(0, m.index)
      const line = before.split('\n').length
      const col = m.index - before.lastIndexOf('\n')
      out.push({ rule: rule.name, hint: rule.hint, match: m[0].trim(), line, col })
      if (m[0].length === 0) rule.re.lastIndex++
      if (out.length > 5000) return out
    }
  }
  return out
}

/**
 * Allowlist entries: { "path": "<posix path or suffix>", "rule": "<rule name or *>",
 * "match": "<optional exact matched text>", "reason": "<why>" }.
 */
export function isAllowed(allowlist, relPath, finding) {
  const p = relPath.replace(/\\/g, '/')
  return allowlist.some((e) => {
    if (!e || typeof e.path !== 'string') return false
    const ep = e.path.replace(/\\/g, '/')
    const pathOk = p === ep || p.endsWith('/' + ep) || p.startsWith(ep.endsWith('/') ? ep : ep + '/')
    const ruleOk = !e.rule || e.rule === '*' || e.rule === finding.rule
    const matchOk = !e.match || e.match === finding.match
    return pathOk && ruleOk && matchOk
  })
}

const BINARY_EXT = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'ico', 'bmp', 'woff', 'woff2', 'ttf', 'otf', 'eot',
  'mp4', 'webm', 'mp3', 'ogg', 'pdf', 'zip', 'gz', 'tar', 'br', 'wasm', 'mo', 'phar',
])

/** True if a file should be scanned as text. */
export function looksLikeText(relPath, buf) {
  const ext = relPath.split('.').pop().toLowerCase()
  if (BINARY_EXT.has(ext)) return false
  const head = buf.subarray(0, 8000)
  return !head.includes(0)
}
