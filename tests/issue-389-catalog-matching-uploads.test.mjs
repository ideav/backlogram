import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

// Issue #389: the catalog-matching landing gains two OPTIONAL file fields
// (our catalog / SKU + the counterparty's / RFP). Files are committed to the
// GitHub orders/ folder by the shared A2 intake handler, exactly like the
// Excel → app landing does. These assertions are PHP-free so they run locally;
// the end-to-end PHP wiring is covered in tests/excel-to-app-backend.test.mjs.

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8')

const pageSource = read('../src/pages/CatalogMatching.tsx')
const backendSource = read('../public/excel-to-app.php')

test('the catalog-matching form posts to the A2 intake handler as multipart', () => {
  // No longer the JSON-only telegram-notify endpoint.
  assert.doesNotMatch(pageSource, /telegram-notify\.php/)
  assert.match(pageSource, /const SUBMIT_ENDPOINT = '\/excel-to-app\.php'/)
  assert.match(pageSource, /new FormData\(\)/)
  assert.match(pageSource, /payload\.append\('source', 'catalog-matching'\)/)
  assert.match(pageSource, /fetch\(SUBMIT_ENDPOINT, \{/)
})

test('the form offers two optional catalog attachments (SKU + RFP)', () => {
  assert.match(pageSource, /Ваш каталог \(SKU\)/)
  assert.match(pageSource, /Каталог контрагента \(RFP\)/)
  // Wording makes clear the attachments are not required.
  assert.match(pageSource, /необязательно/)
  // Two single-file pickers, kept in state.
  assert.match(pageSource, /const \[ourCatalog, setOurCatalog\] = useState<File \| null>\(null\)/)
  assert.match(pageSource, /const \[theirCatalog, setTheirCatalog\] = useState<File \| null>\(null\)/)
  // Spreadsheet formats only.
  assert.match(pageSource, /const ACCEPTED_EXTENSIONS = \[[^\]]*'\.xlsx'/)
})

test('attachments are sent under files[] with role-encoded names', () => {
  assert.match(pageSource, /payload\.append\('files\[\]',\s+ourCatalog,\s+`SKU-\$\{ourCatalog\.name\}`\)/)
  assert.match(pageSource, /payload\.append\('files\[\]',\s+theirCatalog,\s+`RFP-\$\{theirCatalog\.name\}`\)/)
})

test('attachments are optional but a contact is still required', () => {
  // Files must NOT block submission (the whole point of #389).
  assert.doesNotMatch(pageSource, /Прикрепите хотя бы один/)
  // A contact is required so the matched pairs can be returned.
  assert.match(pageSource, /Укажите контакт/)
})

test('the form keeps the shared SmartCaptcha flow', () => {
  assert.match(pageSource, /if \(!CAPTCHA_CLIENT_KEY \|\| !isCaptchaRequested \|\| idbCookieFound\) return/)
  assert.match(pageSource, /captcha_token/)
  assert.match(pageSource, /smartcaptcha\.yandexcloud\.net\/captcha\.js/)
})

test('the A2 backend is source-aware so the wording matches the form', () => {
  // Reads the source field and maps it to a human-readable label.
  assert.match(backendSource, /\$_POST\['source'\]/)
  assert.match(backendSource, /'catalog-matching'\s*=>\s*'Сопоставление каталогов'/)
  // The label drives the issue title, issue body heading and Telegram heading.
  assert.match(backendSource, /intake_build_issue_body\(\s*\$sourceLabel/)
  assert.match(backendSource, /intake_build_telegram_message\(\s*\$sourceLabel/)
})
