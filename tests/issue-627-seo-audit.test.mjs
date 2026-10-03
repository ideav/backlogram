// issue #627 — инварианты, которые чинил SEO-аудит от 02.10.2026.
//
// Аудит мерил живой сайт, здесь — то, что можно проверить до деплоя: сырой HTML
// против отрендеренного, даты вместо даты сборки, навигация без JS, неразрывные
// пробелы. Каждый блок помечен пунктом аудита — отчёт в docs/seo/audit-627.md.
//
// fileURLToPath, а не `new URL('..').pathname`: на Windows pathname даёт
// «/C:/…», и resolve() склеивает «C:\C:\…». Старые тесты репозитория на этом
// падают — новые так писать не надо.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { staticNavLinks } from '../src/data/nav.mjs'
import { renderStaticNav } from '../scripts/lib/static-nav.mjs'
import { nbsp, nbspHtml } from '../src/lib/typography.mjs'
import { humanDate, freshnessLine } from '../src/lib/dates.mjs'
import { CM_META, CM_FORM } from '../src/data/catalogMatching.mjs'
import { QUIZ_META, QUIZ_INTRO, QUESTIONS } from '../src/data/quintetsQuiz.mjs'
import { HOME_FAQ } from '../src/data/home-faq.mjs'
import { offerPath, PRICES_VALID_UNTIL, SERVICES } from '../src/data/services.mjs'

const repo = fileURLToPath(new URL('..', import.meta.url))
const read = (p) => readFileSync(resolve(repo, p), 'utf8')

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

// ───────────────────────────────────────────────────────────────────────────
// п. 3 — страницы-сироты: ссылки меню есть в сыром HTML, и они покрывают карту
// ───────────────────────────────────────────────────────────────────────────

const sitemapPaths = [...read('public/sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((m) => new URL(m[1]).pathname)

test('каждый URL карты сайта достижим по ссылке из статической навигации', () => {
  // Статья базы знаний линкуется со своего раздела (/knowledge-base.html),
  // отраслевые лендинги и прочее — из блока staticNavLinks().
  const linked = new Set(staticNavLinks().map((l) => l.href))
  const orphans = sitemapPaths.filter(
    (p) => !linked.has(p) && !p.startsWith('/knowledge-base/') && p !== '/',
  )
  assert.deepEqual(
    orphans,
    [],
    'страницы без входящих ссылок — добавьте их в src/data/nav.mjs',
  )
})

test('статический блок навигации ссылается только на существующие страницы', () => {
  const inSitemap = new Set(sitemapPaths)
  const dangling = staticNavLinks()
    .map((l) => l.href.replace(/#.*$/, ''))
    .filter((href) => href !== '' && href !== '/' && !inSitemap.has(href))
  assert.deepEqual(dangling, [], 'ссылки на страницы, которых нет в sitemap.xml')
})

test('каждый отраслевой лендинг есть в статической навигации', async () => {
  // Хаб /resheniya.html линкует их React'ом, то есть для краулера без JS их не
  // видно: ровно так /baza-zayavok.html и выпал из обхода (issue #627, п. 3).
  const { USE_CASES } = await import('../src/data/usecases.mjs')
  const linked = new Set(staticNavLinks().map((l) => l.href))
  const missing = USE_CASES.map((u) => `/${u.slug}.html`).filter((h) => !linked.has(h))
  assert.deepEqual(missing, [], 'новый лендинг добавьте в staticExtraLinks (src/data/nav.mjs)')
})

test('блок навигации попадает в сырой HTML и отмечает текущую страницу', () => {
  const html = renderStaticNav('/uslugi.html')
  assert.match(html, /<nav id="static-nav"/)
  assert.match(html, /href="\/uslugi\.html" aria-current="page"/)
  assert.match(html, /href="\/kvintety-ili-tablicy\.html"/)
  const build = JSON.parse(read('package.json')).scripts.build
  assert.ok(
    build.indexOf('prerender-landing.mjs') < build.indexOf('inject-static-nav.mjs'),
    'вставка навигации обязана идти после всех пререндеров — иначе её затрут',
  )
})

test('меню React берёт ссылки из src/data/nav.mjs, а не хранит свой список', () => {
  const header = read('src/components/Header.tsx')
  assert.match(header, /from '\.\.\/data\/nav'/)
  assert.ok(
    !/\{ name: '(Технология|Услуги и цены)', href:/.test(header),
    'список ссылок в Header.tsx — копия данных: он разойдётся со статическим блоком',
  )
})

// ───────────────────────────────────────────────────────────────────────────
// п. 14 — «вес» и «New» не склеиваются с текстом заголовка и анкора
// ───────────────────────────────────────────────────────────────────────────

test('бейдж «вес» отделён от заголовка вопроса текстовым узлом', () => {
  const page = read('src/pages/KvintetyIliTablicy.tsx')
  assert.match(
    page,
    /\{' '\}\s*\n\s*<span className="ml-2 [^"]*">вес \{q\.w\}<\/span>/,
    'без текстового пробела DOM отдаёт «…за 3–5 лет?вес 12»',
  )
})

test('бейдж «New» в меню скрыт от скринридера и отбит пробелом', () => {
  const header = read('src/components/Header.tsx')
  assert.match(header, /<span className="sr-only"> <\/span>/)
  assert.match(header, /aria-hidden="true"/)
})

test('живой счёт квиза объявляется скринридеру', () => {
  const page = read('src/pages/KvintetyIliTablicy.tsx')
  const live = page.match(/aria-live="polite"/g) ?? []
  assert.ok(live.length >= 3, `aria-live найдено ${live.length} раз, нужно ≥3`)
})

// ───────────────────────────────────────────────────────────────────────────
// п. 2 — сырой HTML и отрендеренная страница совпадают по содержанию
// ───────────────────────────────────────────────────────────────────────────

test('снапшот квиза отдаёт все вопросы заголовками и переключателями', () => {
  const script = read('scripts/prerender-kvintety-ili-tablicy.mjs')
  assert.match(script, /QUESTIONS\s*\n?\s*\.map/, 'вопросы должны строиться из данных')
  assert.match(script, /<h2>\$\{qi \+ 1\}\. \$\{escape\(q\.t\)\}/)
  assert.match(script, /type="radio"/)
  assert.ok(QUESTIONS.length >= 13, 'квиз из 13 вопросов — проверка числа не менялась')
})

test('страница сопоставления каталогов и её снапшот берут один источник', () => {
  const page = read('src/pages/CatalogMatching.tsx')
  const script = read('scripts/prerender-catalog-matching.mjs')
  for (const file of [page, script]) {
    assert.match(file, /from '\.\.\/(data|src\/data)\/catalogMatching(\.mjs)?'/)
  }
  // Форма — то, чего в сыром HTML не было вовсе: краулер видел страницу без
  // единственного целевого действия.
  assert.match(script, /<form/)
  assert.equal(CM_FORM.endpoint, '/excel-to-app.php')
})

test('акцент в h1 — настоящее окончание заголовка', () => {
  // React красит синим хвост: h1.slice(0, -h1Accent.length) + <span>.
  // Если хвост перестанет совпадать, в разметке появится обрезанный заголовок.
  assert.ok(
    CM_META.h1.endsWith(CM_META.h1Accent),
    `«${CM_META.h1Accent}» не окончание «${CM_META.h1}»`,
  )
  assert.match(read('src/pages/CatalogMatching.tsx'), /CM_META\.h1\.slice\(0, -CM_META\.h1Accent\.length\)/)
})

// ───────────────────────────────────────────────────────────────────────────
// п. 5 — даты в разметке настоящие, а не дата сборки
// ───────────────────────────────────────────────────────────────────────────

test('ни один пререндер не выводит dateModified из new Date()', () => {
  const offenders = []
  for (const file of readdirSync(resolve(repo, 'scripts')).filter((f) => f.startsWith('prerender-'))) {
    const src = read(`scripts/${file}`)
    for (const m of src.matchAll(/^.*(datePublished|dateModified).*$/gm)) {
      if (/new Date\(\)|todayISO|\btoday\b/.test(m[0])) offenders.push(`${file}: ${m[0].trim()}`)
    }
  }
  assert.deepEqual(offenders, [], 'дата сборки в разметке = «изменено» на каждый деплой')
})

test('все статьи базы знаний датированы', () => {
  const source = read('src/data/knowledgeBase.ts')
  const slugs = source.match(/^ {4}slug: '/gm) ?? []
  const dates = source.match(/^ {4}publishedAt: '\d{4}-\d{2}-\d{2}'/gm) ?? []
  assert.equal(
    dates.length,
    slugs.length,
    `${slugs.length} статей, дат публикации — ${dates.length}`,
  )
})

test('даты квиза заданы руками и в формате ISO', () => {
  assert.match(QUIZ_META.publishedAt, ISO_DATE)
  assert.match(QUIZ_META.updatedAt, ISO_DATE)
  assert.match(CM_META.publishedAt, ISO_DATE)
  assert.match(CM_META.updatedAt, ISO_DATE)
})

test('подпись свежести — один хелпер на React и пререндер', () => {
  assert.equal(humanDate('2026-09-17'), '17 сентября 2026')
  assert.equal(freshnessLine('2026-09-17'), 'Опубликовано 17 сентября 2026')
  assert.equal(freshnessLine('2026-09-17', '2026-09-17'), 'Опубликовано 17 сентября 2026')
  assert.equal(
    freshnessLine('2026-09-17', '2026-10-03'),
    'Опубликовано 17 сентября 2026 · обновлено 3 октября 2026',
  )
})

// ───────────────────────────────────────────────────────────────────────────
// п. 10 — Offer ведёт на якорь услуги и не истекает молча
// ───────────────────────────────────────────────────────────────────────────

test('каждое предложение в разметке услуг ведёт на свой якорь', () => {
  // Было `url: SITE + '/#cta'` у всех услуг сразу: шесть разных Offer указывали
  // на одну и ту же кнопку главной. Теперь либо якорь услуги на /uslugi.html,
  // либо собственная страница услуги (у «разбора процесса» это
  // /excel-to-app.html#razbor) — но всегда якорь, а не просто домен.
  const paths = SERVICES.map((s) => offerPath(s))
  for (const [i, path] of paths.entries()) {
    const id = SERVICES[i].id
    assert.ok(!path.startsWith('/#'), `${id}: ${path} — якорь главной, а не страница услуги`)
    assert.ok(sitemapPaths.includes(path.replace(/#.*$/, '')), `нет в карте сайта: ${path}`)
  }
  assert.equal(new Set(paths).size, paths.length, 'два предложения ведут на один URL')
  assert.match(PRICES_VALID_UNTIL, ISO_DATE)
  const script = read('scripts/prerender-uslugi.mjs')
  assert.match(script, /url: absolute\(offerPath\(s\)\)/)
  assert.match(script, /priceValidUntil: PRICES_VALID_UNTIL/)
  assert.match(script, /seller: \{ '@id': `\$\{SITE\}\/#organization` \}/)
})

// ───────────────────────────────────────────────────────────────────────────
// п. 11 — llms.txt описывает весь сайт, а не его половину
// ───────────────────────────────────────────────────────────────────────────

test('llms.txt перечисляет каждый URL карты сайта', () => {
  const llms = read('public/llms.txt')
  const missing = sitemapPaths.filter((p) => !llms.includes(`https://ideav.ru${p}`))
  assert.deepEqual(missing, [], 'страницы, которых нет в llms.txt')
})

test('число материалов в прозе llms.txt совпадает с базой знаний', () => {
  const llms = read('public/llms.txt')
  const stated = Number(/серия из (\d+) материалов/.exec(llms)?.[1])
  const actual = (read('src/data/knowledgeBase.ts').match(/^ {4}slug: '/gm) ?? []).length
  assert.equal(stated, actual, 'обновите число в llms.txt вместе со статьёй')
})

// ───────────────────────────────────────────────────────────────────────────
// Назначение страницы о квинтетах — решение владельца по issue #627:
// она для тех, кто ищет информацию про нас, а не под спрос по слову «квинтет».
// Отсюда два инварианта: бренд в метаданных и хотя бы один контекстный вход.
// ───────────────────────────────────────────────────────────────────────────

test('метаданные опросника несут бренд и держат лимиты выдачи', () => {
  assert.ok(QUIZ_META.title.includes('Интеграм'), 'без бренда страницу не найдут по запросу про нас')
  assert.ok(QUIZ_META.description.includes('Интеграм'), 'в описании нет бренда')
  assert.ok(QUIZ_META.keywords.includes('Интеграм'), 'в keywords нет бренда')
  assert.ok(QUIZ_META.title.length <= 60, `title ${QUIZ_META.title.length} симв. — обрежется в выдаче`)
  assert.ok(
    QUIZ_META.description.length <= 158,
    `description ${QUIZ_META.description.length} симв. — обрежется в выдаче`,
  )
})

test('шапка опросника объясняет, что квинтеты — модель хранения Интеграма', () => {
  // Без этого абзаца страница читается как отвлечённое сравнение трёх вариантов
  // и на вопрос «на чём работает Интеграм» не отвечает.
  const [head, body] = QUIZ_INTRO[0]
  assert.match(`${head} ${body}`, /Интеграм/)
})

test('на опросник ведёт контекстная ссылка, а не только меню', () => {
  // Пункт меню — не вход для того, кто изучает платформу: он ищет ответ, а не
  // раздел. FAQ главной — единственная поверхность, которая этот запрос ловит.
  const faqLinks = HOME_FAQ.map((item) => item.link?.href)
  assert.ok(
    faqLinks.includes(QUIZ_META.path),
    'ни один ответ FAQ главной не ведёт на опросник о квинтетах',
  )
  const storage = HOME_FAQ.find((item) => item.link?.href === QUIZ_META.path)
  assert.match(storage.q.toLowerCase(), /хранит/, 'вопрос должен быть про хранение данных')
  assert.match(storage.a, /квинтет/i, 'ответ должен называть модель хранения своим именем')
})

// ───────────────────────────────────────────────────────────────────────────
// п. 13 — неразрывные пробелы в статическом HTML
// ───────────────────────────────────────────────────────────────────────────

test('nbsp() приклеивает предлоги, единицы и тире', () => {
  assert.equal(nbsp('данные в базе'), 'данные в&nbsp;базе')
  // Два предлога подряд: первый матч не должен съедать пробел второго.
  assert.equal(nbsp('и в базе'), 'и&nbsp;в&nbsp;базе')
  assert.equal(nbsp('файл до 25 МБ'), 'файл до&nbsp;25&nbsp;МБ')
  assert.equal(nbsp('Интеграм — конструктор'), 'Интеграм&nbsp;— конструктор')
  // «Восемь» начинается на «о», но предлог — это слово целиком.
  assert.equal(nbsp('около восьми'), 'около восьми')
})

test('nbspHtml() не трогает теги, атрибуты и код', () => {
  const html = '<a href="/a b.html" title="и в базе">и в базе</a>'
  assert.equal(
    nbspHtml(html),
    '<a href="/a b.html" title="и в базе">и&nbsp;в&nbsp;базе</a>',
  )
  assert.equal(nbspHtml('<pre>и в базе</pre>'), '<pre>и в базе</pre>')
  assert.equal(nbspHtml('<!-- и в базе -->'), '<!-- и в базе -->')
})

test('nbspHtml() не ломается на «<» внутри скрипта', () => {
  // Счётчик Метрики содержит `for (var j = 0; j < document.scripts.length; j++)`:
  // этот «<» начинал фальшивый тег, и разбор переставал видеть текст до конца
  // файла — проход тихо не делал ничего.
  const html =
    '<p>и в базе</p><script>for (var j = 0; j < n.length; j++) {}</script><p>и в базе</p>'
  const out = nbspHtml(html)
  assert.equal(out.match(/и&nbsp;в&nbsp;базе/g)?.length, 2)
  assert.ok(out.includes('j < n.length'), 'скрипт должен остаться байт-в-байт')
})

// ───────────────────────────────────────────────────────────────────────────
// пп. 1, 6, 12 — блог: разметка, robots, карта сайта
//
// blog-v2 — отдельная сборка Astro со своим package.json, и в dist/ основного
// сайта её нет. Проверяем исходники и чистые ESM-модули: собрать блог в этой
// сети нельзя (npm install не проходит), поэтому гейт здесь — единственный до
// деплоя.
// ───────────────────────────────────────────────────────────────────────────

test('страница статьи блога отдаёт граф BlogPosting с датой правки', () => {
  const page = read('blog-v2/src/pages/posts/[...slug].astro')
  assert.match(page, /postGraph\(/)
  assert.match(page, /dateModified: \(post\.data\.updatedDate \?\? post\.data\.pubDate\)/)
  assert.match(page, /jsonLd=\{graph\}/)
  assert.match(page, /modifiedTime=/)
  const config = read('blog-v2/src/content.config.ts')
  assert.match(config, /updatedDate: z\.coerce\.date\(\)\.optional\(\)/)
})

test('списки блога отдают CollectionPage, а не остаются без разметки', () => {
  for (const p of ['blog-v2/src/pages/index.astro', 'blog-v2/src/pages/category/[slug].astro', 'blog-v2/src/pages/tag/[slug].astro']) {
    assert.match(read(p), /collectionGraph\(/, p)
    assert.match(read(p), /jsonLd=\{graph\}/, p)
  }
})

test('JSON-LD в шаблоне блога экранирует «<»', () => {
  // set:html без экранирования закрыл бы <script> содержимым заголовка.
  assert.match(
    read('blog-v2/src/layouts/BaseLayout.astro'),
    /JSON\.stringify\(jsonLd\)\.replace\(\/<\/g, '\\\\u003c'\)/,
  )
})

test('служебные страницы блога закрыты от индекса', () => {
  assert.match(read('blog-v2/src/pages/search.astro'), /robots="noindex, follow"/)
  assert.match(read('blog-v2/src/pages/404.astro'), /robots="noindex, follow"/)
})

test('порог «тонкого тега» — один на robots и на карту сайта', () => {
  // Два потребителя: tag/[slug].astro (через tags.ts) и astro.config.mjs.
  assert.match(read('blog-v2/src/lib/tags.ts'), /export \{ tagSlug, isThinTag, THIN_TAG_MIN_POSTS \} from '\.\/tag-slug\.mjs'/)
  assert.match(read('blog-v2/src/pages/tag/[slug].astro'), /robots=\{thin \? 'noindex, follow' : undefined\}/)
  const config = read('blog-v2/astro.config.mjs')
  assert.match(config, /isThinTag\(TAG_COUNTS\.get\(tag\[1\]\) \?\? 0\)/)
  assert.match(config, /path\.startsWith\(`\$\{BASE\}\/search`\)\) return false/)
  assert.match(config, /serialize:/)
})

test('карта сайта блога получает lastmod на каждый URL', async () => {
  const { readPosts, tagCounts } = await import('../blog-v2/src/lib/posts-meta.mjs')
  const posts = readPosts()
  assert.ok(posts.length > 0, 'статьи блога не прочитались — изменился фронтматтер?')
  const undated = posts.filter((p) => !ISO_DATE.test(p.lastmod ?? ''))
  assert.deepEqual(
    undated.map((p) => p.slug),
    [],
    'без pubDate/updatedDate статья уедет в карту без lastmod',
  )
  // Счётчики тегов — вход фильтра карты: пустая карта означала бы, что
  // фронтматтер читается, а теги нет.
  const counts = tagCounts(posts)
  assert.ok(counts.size > 0)
  assert.ok([...counts.values()].every((n) => n > 0))
})

test('слаги тегов совпадают со схемой WordPress — живые адреса не ломаем', async () => {
  const { tagSlug, isThinTag, THIN_TAG_MIN_POSTS } = await import('../blog-v2/src/lib/tag-slug.mjs')
  assert.equal(tagSlug('Лайфхаки'), 'laifhaki')
  assert.equal(tagSlug('Яндекс.Директ'), 'yandeks-direkt')
  assert.equal(THIN_TAG_MIN_POSTS, 3)
  assert.equal(isThinTag(2), true)
  assert.equal(isThinTag(3), false)
})

test('шаг типографики стоит в сборке последним по HTML', () => {
  const build = JSON.parse(read('package.json')).scripts.build
  assert.ok(build.includes('scripts/apply-typography.mjs'))
  assert.ok(
    build.indexOf('scripts/inject-static-nav.mjs') < build.indexOf('scripts/apply-typography.mjs'),
    'типографика обязана идти после последнего шага, который пишет HTML',
  )
})
