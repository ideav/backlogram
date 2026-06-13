import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8')

const pageSource = read('../src/pages/ExcelToApp.tsx')
const routerSource = read('../src/router.tsx')
const homeSource = read('../src/pages/Home.tsx')
const headerSource = read('../src/components/Header.tsx')
const sitemapSource = read('../public/sitemap.xml')

test('the /excel-to-app.html route is registered and renders ExcelToApp', () => {
  assert.match(routerSource, /import ExcelToApp from '\.\/pages\/ExcelToApp'/)
  assert.match(
    routerSource,
    /path:\s*'excel-to-app\.html',\s*\n\s*element:\s*<ExcelToApp \/>/,
    'router should map excel-to-app.html to <ExcelToApp />',
  )
})

test('the landing collects files, a topic and a contact', () => {
  // Multiple file upload restricted to spreadsheet formats.
  assert.match(pageSource, /type="file"/)
  assert.match(pageSource, /multiple/)
  assert.match(pageSource, /const ACCEPTED_EXTENSIONS = \[[^\]]*'\.xlsx'/)
  // Topic and contact inputs.
  assert.match(pageSource, /name="topic"/)
  assert.match(pageSource, /name="contact"/)
})

test('the landing validates files, topic and contact before submitting', () => {
  assert.match(pageSource, /Прикрепите хотя бы один Excel-файл\./)
  assert.match(pageSource, /Опишите тематику будущего приложения\./)
  assert.match(pageSource, /Укажите контакт/)
})

test('the landing shows distinct success and error screens', () => {
  assert.match(pageSource, /formState === 'success'/)
  assert.match(pageSource, /Заявка принята!/)
  assert.match(pageSource, /formState === 'error'/)
})

test('the landing posts to the A2 handler with file attachments', () => {
  assert.match(pageSource, /const SUBMIT_ENDPOINT = '\/excel-to-app\.php'/)
  assert.match(pageSource, /new FormData\(\)/)
  assert.match(pageSource, /payload\.append\('files\[\]', file, file\.name\)/)
  assert.match(pageSource, /fetch\(SUBMIT_ENDPOINT, \{/)
})

test('the landing uses the same SmartCaptcha flow as the CTA form', () => {
  // Lazily requested, skipped for idb_* visitors — identical guard to Home.tsx.
  assert.match(
    pageSource,
    /if \(!CAPTCHA_CLIENT_KEY \|\| !isCaptchaRequested \|\| idbCookieFound\) return/,
  )
  assert.match(pageSource, /function hasIdbCookie\(\): boolean/)
  assert.match(
    pageSource,
    /document\.cookie\.split\(';'\)\.some\(c => c\.trimStart\(\)\.startsWith\('idb_'\)\)/,
  )
  assert.match(
    pageSource,
    /\{CAPTCHA_CLIENT_KEY && !idbCookieFound && isCaptchaRequested && \(/,
  )
  assert.match(pageSource, /smartcaptcha\.yandexcloud\.net\/captcha\.js/)
  assert.match(pageSource, /captcha_token/)
})

test('the landing offers the @Integrammbot Telegram shortcut next to the upload CTA', () => {
  // Issue #355: a faster, alternative path for visitors who already use Telegram.
  assert.match(pageSource, /const TELEGRAM_BOT_URL = 'https:\/\/t\.me\/Integrammbot'/)
  assert.match(pageSource, /href=\{TELEGRAM_BOT_URL\}/)
  assert.match(pageSource, /Открыть в Telegram-боте/)
  assert.match(pageSource, /@Integrammbot/)
})

test('the landing form anchor has scroll margin for the fixed header', () => {
  const section = pageSource.match(/<section\s+id="excel-form"\s+className="([^"]+)"/)
  assert.ok(section, 'expected a form section with id="excel-form"')
  assert.match(section[1], /(?:^|\s)scroll-mt-\d+(?:\s|$)/)
})

test('the home page promotes the Excel → app landing', () => {
  const promo = homeSource.match(/<Link\s+[\s\S]*?to="\/excel-to-app\.html"[\s\S]*?<\/Link>/)
  assert.ok(promo, 'expected a promo Link to /excel-to-app.html on the home page')
  assert.match(promo[0], /Загрузите Excel — получите приложение/)
})

test('the header links to the Excel → app landing', () => {
  assert.match(headerSource, /href:\s*'\/excel-to-app\.html'/)
})

test('the landing is listed in the sitemap', () => {
  assert.match(sitemapSource, /<loc>https:\/\/ideav\.ru\/excel-to-app\.html<\/loc>/)
})
