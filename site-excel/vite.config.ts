import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'
import { CASES, CONTACT_EMAIL, FAQ, PAGES, PRAKTIKUM, PRICING_GROUPS, TELEGRAM_BOT_URL } from './src/content'
import { metrikaSnippet } from './src/metrika'
import { jsonLdScript, landingJsonLd } from './src/seo'
import { loadLandings } from './landings.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Лендинг «Excel → приложение» на отдельном домене. Своя сборка, свой вход,
// свой dist — с сайтом в корне репозитория не связан ничем, кроме этого
// репозитория (по образцу site-en/, issue #524).
//
// Зачем отдельный домен, а не страница на ideav.ru:
//
//   1. Своя Метрика и свои цели. Счётчик основного сайта за всю историю принял
//      три конверсии с рекламы на 16 048 ₽ расхода — эта статистика тянется за
//      аккаунтом и мешает стратегии с оплатой за конверсии обучаться.
//   2. Изоляция риска. Кампания построена на стратегии «оплата за конверсии»
//      с целью, спрятанной за первым кликом; Яндекс такие схемы со временем
//      прикрывает. Прикроют — потеряем отдельный домен, а не ideav.ru.
//
// Адрес сборки не зашит: домен куплен отдельно и может смениться.
//
//   SITE_URL     схема + хост, без пути        обязательна
//   SITE_BASE    путь на хосте                 по умолчанию `/`
//   METRIKA_ID   счётчик Яндекс.Метрики        без него счётчик не ставится
//
//   SITE_URL=https://example.ru METRIKA_ID=1234567 npm run build:excel
//
// Из SITE_URL/SITE_BASE считается всё абсолютное: пути к ассетам, canonical,
// og:url, robots.txt и sitemap.xml.

/** `en`, `/en`, `en/` → `/en/`; пусто → `/`. */
function normalizeBase(raw: string | undefined): string {
  const trimmed = (raw ?? '').trim()
  if (trimmed === '' || trimmed === '/') return '/'
  return `/${trimmed.replace(/^\/+/, '').replace(/\/+$/, '')}/`
}

const BASE = normalizeBase(process.env.SITE_BASE)
const ORIGIN = (process.env.SITE_URL ?? '').trim().replace(/\/+$/, '')
const CANONICAL = ORIGIN + BASE
// Домен, на котором счётчику разрешено стартовать (issue #703).
const SITE_HOST = (() => { try { return new URL(ORIGIN).hostname } catch { return '' } })()

// Счётчик — строка цифр или пусто. Пустой счётчик означает «не подключать»:
// слать цели в несуществующий счётчик хуже, чем не слать вовсе, потому что
// в Директе это выглядит как работающая цель с нулём конверсий.
const METRIKA_ID = (process.env.METRIKA_ID ?? '').trim().replace(/\D/g, '')

// Все адреса домена: страницы из content.ts и посадочные из landings/*.json
// (issue #657). Проверяет посадочные пререндер — здесь только список адресов.
const SITE_PAGES = [
  ...PAGES,
  ...loadLandings(path.resolve(__dirname, 'landings')).map(page => ({
    path: `/${page.slug}/`,
    title: page.title as string,
    description: page.description as string,
    published: page.published as string,
    updated: page.updated as string,
  })),
]

/**
 * Подставляет то, чего Vite не касается: canonical/og:url и счётчик в
 * index.html, robots.txt и sitemap.xml с абсолютными адресами.
 */
function deploymentMeta(): Plugin {
  return {
    name: 'excel-deployment-meta',
    buildStart() {
      if (ORIGIN === '') {
        // Молча собрать лендинг с пустым canonical — значит выложить на купленный
        // домен страницу, которая ссылается сама на «/». Лучше упасть.
        this.error('SITE_URL не задан: сборка не знает, на каком домене будет жить лендинг')
      }
    },
    transformIndexHtml(html) {
      return html
        .replaceAll('{{CANONICAL}}', CANONICAL)
        .replace('{{JSONLD}}', jsonLdScript(landingJsonLd(CANONICAL)))
        .replace('{{METRIKA}}', metrikaSnippet(METRIKA_ID, SITE_HOST))
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: [
          `# robots.txt for ${CANONICAL}`,
          '',
          'User-agent: *',
          'Allow: /',
          '',
          `Sitemap: ${CANONICAL}sitemap.xml`,
          '',
        ].join('\n'),
      })
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          ...SITE_PAGES.flatMap(page => [
            '  <url>',
            `    <loc>${absolute(page.path)}</loc>`,
            `    <lastmod>${page.updated}</lastmod>`,
            '    <changefreq>monthly</changefreq>',
            `    <priority>${page.path === '/' ? '1.0' : '0.8'}</priority>`,
            '  </url>',
          ]),
          '</urlset>',
          '',
        ].join('\n'),
      })
      this.emitFile({ type: 'asset', fileName: 'llms.txt', source: llmsTxt() })
      this.emitFile({ type: 'asset', fileName: 'pricing.md', source: pricingMarkdown() })
      this.emitFile({ type: 'asset', fileName: '.htaccess', source: htaccess() })
    },
  }
}

/** `/keysy/atex/` → `https://excel-to-app.ru/keysy/atex/` с учётом SITE_BASE. */
function absolute(sitePath: string): string {
  return CANONICAL + sitePath.replace(/^\/+/, '')
}

/**
 * `/llms.txt` — карта домена для языковых моделей (находка 5 аудита).
 *
 * Пользы от автокраулинга тут немного; ценность в другом сценарии — человек
 * даёт модели адрес сайта и спрашивает «а что это». Поэтому файл должен сам
 * по себе отвечать на вопрос: что делаем, почём, какие кейсы, куда писать.
 */
function llmsTxt(): string {
  const [home, ...rest] = SITE_PAGES
  return [
    '# Интеграм — приложение из Excel-таблицы',
    '',
    `> ${home.description}`,
    '',
    'Сервис АО «Интеграм»: ИИ-агент разбирает присланные рабочие таблицы Excel',
    'и собирает из них веб-приложение с формами, ролями, правами доступа,',
    'отчётами и графиками. Демонстрация на данных заказчика — бесплатно,',
    'примерно 45 минут. Данные хранятся на сервере в России; платформа внесена',
    'в реестр российского ПО (запись №30872).',
    '',
    '## Страницы',
    '',
    `- [${home.title}](${absolute(home.path)}): главная — как это устроено, цены, вопросы и ответы`,
    ...rest.map(page => `- [${page.title}](${absolute(page.path)}): ${page.description}`),
    `- [Цены отдельным файлом](${absolute('/pricing.md')}): тот же прайс в markdown`,
    '',
    '## Цены',
    '',
    'Демонстрация на ваших файлах — 0 ₽.',
    `Практикум «${PRAKTIKUM.title}» для новичков, час онлайн на вашем файле — ${PRAKTIKUM.price}: ${absolute(`/${PRAKTIKUM.slug}/`)}`,
    ...PRICING_GROUPS.flatMap(group =>
      group.plans.map(plan => `- ${plan.title} — ${plan.price} ₽${plan.unit ? ` ${plan.unit}` : ''}`),
    ),
    '',
    '## Кейсы',
    '',
    ...CASES.map(
      item =>
        `- ${item.client}, ${item.industry.toLowerCase()} (${item.facts.join(', ')}): ${absolute(`/keysy/${item.slug}/`)}`,
    ),
    '',
    '## Вопросы и ответы',
    '',
    ...FAQ.flatMap(({ q, a }) => [`### ${q}`, '', a, '']),
    '## Контакты',
    '',
    `- Телеграм-бот: ${TELEGRAM_BOT_URL}`,
    `- Почта: ${CONTACT_EMAIL}`,
    '',
  ].join('\n')
}

/** `/pricing.md` — прайс в markdown, из того же источника, что и блок «Сколько стоит». */
function pricingMarkdown(): string {
  const lines = [
    '# Цены — приложение из Excel на Интеграме',
    '',
    `Актуально для ${CANONICAL}. Все суммы в рублях, с НДС не облагается (УСН).`,
    '',
    '**Демонстрация на ваших файлах — бесплатно.** Присылаете таблицы и описание',
    'задачи, примерно через 45 минут получаете ссылку на работающее приложение',
    'с вашими данными.',
    '',
    `**Практикум «${PRAKTIKUM.title}» — ${PRAKTIKUM.price}.** Час онлайн с ведущим`,
    'на собранном из вашего файла приложении, для новичков в ИИ.',
    `${PRAKTIKUM.payment} Подробно: ${absolute(`/${PRAKTIKUM.slug}/`)}`,
    '',
  ]
  for (const group of PRICING_GROUPS) {
    lines.push(`## ${group.title} (${group.tag.toLowerCase()})`, '', group.body, '')
    for (const plan of group.plans) {
      lines.push(
        `### ${plan.title} — ${plan.price} ₽${plan.unit ? ` ${plan.unit}` : ''}`,
        '',
        plan.sub,
        '',
        ...plan.items.map(item => `- ${item}`),
        '',
      )
    }
  }
  lines.push(
    '## Как заказать',
    '',
    `- Форма на ${CANONICAL} — приложить Excel и описать задачу.`,
    `- Телеграм-бот ${TELEGRAM_BOT_URL} — то же самое, ответ приходит в чат.`,
    `- Почта ${CONTACT_EMAIL}.`,
    '',
  )
  return lines.join('\n')
}

/**
 * `.htaccess` для вебрута домена.
 *
 * 301 с `www` (находка 6 аудита): без него у домена две версии каждой
 * страницы, и спасает только canonical. Правило идёт первым — до любых
 * будущих.
 *
 * Важно: файл не должен трогать `order.php` и каталоги статических страниц —
 * никакого фронт-контроллера здесь нет, адреса `/keysy/<slug>/` отдаются
 * обычным DirectoryIndex.
 */
function htaccess(): string {
  return [
    `# ${CANONICAL} — сгенерировано site-excel/vite.config.ts, правьте там.`,
    '',
    'DirectoryIndex index.html',
    '',
    '<IfModule mod_rewrite.c>',
    '  RewriteEngine On',
    '',
    '  # www.excel-to-app.ru → excel-to-app.ru одним 301 (SEO, issue #626).',
    '  RewriteCond %{HTTP_HOST} ^www\\.(.+)$ [NC]',
    '  RewriteRule ^ https://%1%{REQUEST_URI} [L,R=301]',
    '',
    '  # http → https одним 301 (issue #738). Такое правило есть и в <Directory>',
    '  # хостинга, но RewriteEngine On в этом файле отменяет правила родителя,',
    '  # и http://excel-to-app.ru/ отдавал 200 — две версии каждой страницы.',
    '  # Только GET/HEAD: POST после редиректа потерял бы тело формы.',
    '  RewriteCond %{HTTPS} off',
    '  RewriteCond %{REQUEST_METHOD} ^(GET|HEAD)$',
    '  RewriteCond %{REQUEST_URI} !^/\\.well-known/',
    '  RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]',
    '</IfModule>',
    '',
    '<IfModule mod_mime.c>',
    '  AddType text/markdown .md',
    '  AddCharset UTF-8 .md',
    '</IfModule>',
    '',
  ].join('\n')
}

export default defineConfig({
  root: __dirname,
  base: BASE,

  define: {
    __METRIKA_ID__: JSON.stringify(METRIKA_ID),
    __SITE_BASE__: JSON.stringify(BASE),
  },

  plugins: [react(), tailwindcss(), deploymentMeta()],

  build: {
    outDir: path.resolve(__dirname, '../dist-excel'),
    emptyOutDir: true,
  },

  cacheDir: path.resolve(__dirname, '../.vite/excel'),

  resolve: {
    alias: {
      '@excel': path.resolve(__dirname, './src'),
    },
  },

  server: {
    host: '0.0.0.0',
    port: 5175,
  },
})
