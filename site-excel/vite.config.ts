import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

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

// Счётчик — строка цифр или пусто. Пустой счётчик означает «не подключать»:
// слать цели в несуществующий счётчик хуже, чем не слать вовсе, потому что
// в Директе это выглядит как работающая цель с нулём конверсий.
const METRIKA_ID = (process.env.METRIKA_ID ?? '').trim().replace(/\D/g, '')

/** Код счётчика Метрики. Пусто, если METRIKA_ID не задан. */
function metrikaSnippet(): string {
  if (METRIKA_ID === '') return '<!-- METRIKA_ID не задан: счётчик не подключён -->'
  return `<script type="text/javascript">
      (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
      m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}
      k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
      (window,document,'script','https://mc.yandex.ru/metrika/tag.js','ym');
      ym(${METRIKA_ID}, 'init', {webvisor:true, clickmap:true, trackLinks:true, accurateTrackBounce:true});
    </script>
    <noscript><div><img src="https://mc.yandex.ru/watch/${METRIKA_ID}" style="position:absolute; left:-9999px;" alt="" /></div></noscript>`
}

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
        .replace('{{METRIKA}}', metrikaSnippet())
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
          '  <url>',
          `    <loc>${CANONICAL}</loc>`,
          '    <changefreq>monthly</changefreq>',
          '    <priority>1.0</priority>',
          '  </url>',
          '</urlset>',
          '',
        ].join('\n'),
      })
    },
  }
}

export default defineConfig({
  root: __dirname,
  base: BASE,

  define: {
    __METRIKA_ID__: JSON.stringify(METRIKA_ID),
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
