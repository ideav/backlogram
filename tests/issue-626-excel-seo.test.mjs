/**
 * Issue #626 — правки по SEO-аудиту excel-to-app.ru от 02.10.2026.
 *
 * Аудит нашёл, что весь видимый контент рисуется JS (в сыром HTML — пустой
 * `<div id="root">`), три кейса из четырёх не попадают в DOM даже после
 * рендера (их прячет карусель), страница на домене одна, и нет ни `og:image`,
 * ни JSON-LD, ни `/llms.txt`.
 *
 * Тесты ниже стерегут каждую из этих правок на уровне исходников. Сам
 * результат сборки они не трогают: сборка требует SITE_URL и занимает
 * несколько секунд, а `npm test` должен оставаться быстрым. Проверка
 * собранного dist — в README лендинга, в разделе про выкладку.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

const read = (p) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8')

const content = read('../site-excel/src/content.ts')
const cases = read('../site-excel/src/Cases.tsx')
const landing = read('../site-excel/src/Landing.tsx')
const indexHtml = read('../site-excel/index.html')
const viteConfig = read('../site-excel/vite.config.ts')
const seo = read('../site-excel/src/seo.ts')
const prerender = read('../scripts/prerender-site-excel.mjs')
const faq = read('../site-excel/src/Faq.tsx')
const main = read('../site-excel/src/main.tsx')

// ── Находка 1: пустой #root в сыром HTML ────────────────────────────────────

test('сборка лендинга заканчивается пререндером, а не голым vite build', () => {
  const pkg = JSON.parse(read('../package.json'))
  assert.match(pkg.scripts['build:excel'], /vite build .*&&.*prerender-site-excel\.mjs/)
})

test('снимок рисуется из тех же компонентов, что видит посетитель', () => {
  // Руками переписанный снимок разъезжается с живой страницей — ровно это
  // и случилось бы, если бы разметку собирал сам скрипт.
  const entry = read('../site-excel/src/prerender.tsx')
  assert.match(entry, /renderToStaticMarkup\(<Landing \/>\)/)
  assert.match(entry, /from '\.\/Landing'/)
  assert.match(prerender, /<div id="root"><\/div>/)
  // Падать, а не молча отдавать пустую страницу.
  assert.match(prerender, /process\.exit\(1\)/)
})

test('React по-прежнему монтируется в #root поверх снимка', () => {
  assert.match(main, /createRoot\(document\.getElementById\('root'\)!\)\.render\(/)
})

// ── Находка 9: карусель прятала три кейса из четырёх ────────────────────────

test('все кейсы лежат в разметке, скрыт только неактивный слайд', () => {
  const slider = cases.slice(cases.indexOf('export function Cases('))
  assert.match(slider, /CASES\.map\(\(item, i\) =>/)
  assert.match(slider, /className=\{i === index \? undefined : 'hidden'\}/)
  // Снимок одного слайда — ровно то, от чего уходим.
  assert.ok(!slider.includes('<CaseBody item={current}'), 'в DOM должен попадать не только открытый кейс')
})

// ── Находка 2: одна индексируемая страница ──────────────────────────────────

test('у каждого кейса свой адрес, заголовок и описание', () => {
  const slugs = [...content.matchAll(/^ {4}slug: '([a-z-]+)',$/gm)].map(m => m[1])
  assert.equal(slugs.length, 4, 'кейсов четыре, и у каждого должен быть slug')
  assert.equal(new Set(slugs).size, 4, 'slug кейса обязан быть уникальным — это адрес страницы')
  // Шестая страница — практикум для новичков (issue #659), седьмая и восьмая —
  // адепты и партнёры (issue #671).
  assert.equal((content.match(/pageTitle: '/g) ?? []).length, 8, 'четыре кейса, сравнение, практикум, адепты, партнёры')
  assert.equal((content.match(/pageDescription:\n?\s+'/g) ?? []).length, 8)
})

test('страницы собираются и попадают в sitemap и перелинковку', () => {
  assert.match(prerender, /renderStaticPages\(CANONICAL\)/)
  assert.match(prerender, /mkdirSync\(dir, \{ recursive: true \}\)/)
  // sitemap строится из PAGES, а не из одной захардкоженной строки.
  assert.match(viteConfig, /PAGES\.flatMap\(page => \[/)
  assert.match(viteConfig, /<loc>\$\{absolute\(page\.path\)\}<\/loc>/)
  // Со слайда есть ссылка на страницу кейса, иначе спутники останутся сиротами.
  assert.match(cases, /href=\{`\$\{SITE_BASE\}keysy\/\$\{item\.slug\}\/`\}/)
})

test('на страницах-спутниках нет скрипта приложения', () => {
  // Он смонтировал бы в #root лендинг и стёр бы содержимое страницы.
  const template = prerender.slice(prerender.indexOf('function pageHtml'))
  assert.ok(!template.includes('<script type="module"'), 'спутники отдаются без бандла')
  assert.match(template, /<div id="page">/)
  assert.match(template, /<link rel="canonical" href="\$\{url\}" \/>/)
})

// ── Находки 3 и 4: превью ссылки и структурированные данные ─────────────────

test('у главной есть og:image, twitter:card и типографский апостроф', () => {
  assert.match(indexHtml, /<meta property="og:image" content="\{\{CANONICAL\}\}og\/excel-to-app\.png" \/>/)
  assert.match(indexHtml, /<meta name="twitter:card" content="summary_large_image" \/>/)
  assert.ok(!indexHtml.includes("Excel'ем"), 'в заголовке нужен типографский апостроф Excel’ем')
  assert.ok(indexHtml.includes('Excel’ем'))
})

test('карточки OG лежат в репозитории, по одной на страницу', () => {
  const names = [
    'excel-to-app',
    'keysy-proizvodstvo-kormov',
    'keysy-rezka-termorulonov',
    'keysy-sopostavlenie-zayavok',
    'keysy-upravlenie-kompaniej',
    'sravnenie',
  ]
  for (const name of names) {
    const png = readFileSync(fileURLToPath(new URL(`../site-excel/public/og/${name}.png`, import.meta.url)))
    assert.deepEqual([...png.subarray(1, 4)], [0x50, 0x4e, 0x47], `${name}.png — не PNG`)
    assert.ok(png.length > 10_000, `${name}.png подозрительно мал`)
  }
})

test('JSON-LD: организация, услуга с ценами и вопросы', () => {
  assert.match(indexHtml, /\{\{JSONLD\}\}/)
  assert.match(viteConfig, /jsonLdScript\(landingJsonLd\(CANONICAL\)\)/)
  for (const type of ["'@type': 'Organization'", "'@type': 'Service'", "'@type': 'FAQPage'", "'@type': 'BreadcrumbList'"]) {
    assert.ok(seo.includes(type), `нет ${type}`)
  }
  // Цены в разметке берутся из тех же карточек, что и на странице.
  assert.match(seo, /for \(const group of PRICING_GROUPS\)/)
  // `</script>` внутри текста не должен закрывать тег раньше времени.
  assert.match(seo, /payload\.replace\(\/<\/g, '\\\\u003c'\)/)
})

test('вопросы на странице и в разметке — из одного массива', () => {
  // С issue #738 блок принимает свои вопросы (кейсы); по умолчанию — FAQ главной.
  assert.match(faq, /items = FAQ,/)
  assert.match(faq, /items\.map\(\(\{ q, a \}\)/)
  assert.match(landing, /<Faq \/>/)
  assert.match(seo, /mainEntity: FAQ\.map/)
  assert.ok((content.match(/^\s{4}q: '/gm) ?? []).length >= 5, 'вопросов должно быть больше горстки')
})

// ── Находки 5 и 6: llms.txt, pricing.md, www ────────────────────────────────

test('сборка кладёт llms.txt, pricing.md и .htaccess с 301 на голый домен', () => {
  assert.match(viteConfig, /fileName: 'llms\.txt'/)
  assert.match(viteConfig, /fileName: 'pricing\.md'/)
  assert.match(viteConfig, /fileName: '\.htaccess'/)
  const htaccess = viteConfig.slice(viteConfig.indexOf('function htaccess()'))
  assert.match(htaccess, /RewriteCond %\{HTTP_HOST\} \^www\\\\\.\(\.\+\)\$ \[NC\]/)
  assert.match(htaccess, /R=301/)
  // Фронт-контроллера на домене нет: лишний RewriteRule перехватил бы order.php.
  assert.ok(!htaccess.includes('index.php'), 'на этом домене фронт-контроллера нет')
})

test('llms.txt и pricing.md собираются из тех же данных, что и страница', () => {
  assert.match(viteConfig, /function llmsTxt\(\)/)
  assert.match(viteConfig, /\.\.\.FAQ\.flatMap/)
  assert.match(viteConfig, /\.\.\.CASES\.map/)
  assert.match(viteConfig, /function pricingMarkdown\(\)/)
  assert.match(viteConfig, /for \(const group of PRICING_GROUPS\)/)
})
