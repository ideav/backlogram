#!/usr/bin/env node
/**
 * Карточки Open Graph для excel-to-app.ru (issue #626, находка 3).
 *
 * Ни `og:image`, ни `twitter:card` у домена не было: ссылка в мессенджере и
 * в соцсети приходила без превью. Карточек шесть — главная, четыре кейса и
 * страница сравнения; у каждой свой заголовок, иначе превью у всех
 * одинаковое и кликать по ним незачем.
 *
 * Путь рендера тот же, что у карточек базы знаний
 * (`scripts/generate-og-images.mjs`): Satori (JSX → SVG с нормальной
 * кириллической вёрсткой) → resvg (SVG → PNG). Браузер не нужен.
 *
 * PNG кладутся в `site-excel/public/og/` и коммитятся: сборка на машине без
 * шрифтов и без сети всё равно должна собрать полный dist.
 *
 *   npm run og-excel
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { Resvg } from '@resvg/resvg-js'
import satori from 'satori'
import { build } from 'esbuild'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const outDir = resolve(root, 'site-excel/public/og')
mkdirSync(outDir, { recursive: true })

const fontRegular = readFileSync(resolve(__dirname, 'fonts/Inter-Regular.ttf'))
const fontBold = readFileSync(resolve(__dirname, 'fonts/Inter-Bold.ttf'))

// Тексты карточек — из того же content.ts, что и сами страницы.
const bundle = await build({
  entryPoints: [resolve(root, 'site-excel/src/content.ts')],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  target: 'es2020',
  write: false,
  logLevel: 'error',
})
const { CASES, COMPARE_PAGE } = await import(
  'data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64')
)

const BRAND = '#307FE2'
const DOMAIN = 'excel-to-app.ru'

function card({ eyebrow, title, subtitle }) {
  const div = (style, children) => ({ type: 'div', props: { style, children } })
  return div(
    {
      width: 1200,
      height: 630,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      backgroundColor: '#0F172A',
      backgroundImage:
        'radial-gradient(circle at 92% 8%, rgba(48,127,226,0.28) 0%, transparent 45%), radial-gradient(circle at 5% 95%, rgba(48,127,226,0.14) 0%, transparent 50%)',
      padding: 64,
      fontFamily: 'Inter',
      color: '#F1F5F9',
    },
    [
      div({ display: 'flex', flexDirection: 'column', gap: 24 }, [
        div({ display: 'flex', alignItems: 'center', gap: 16 }, [
          div(
            {
              width: 56,
              height: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: BRAND,
              borderRadius: 10,
              color: '#F8FAFC',
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: -1,
            },
            'И',
          ),
          div({ display: 'flex', flexDirection: 'column', gap: 2 }, [
            div({ fontSize: 24, fontWeight: 700, color: '#F1F5F9' }, 'Интеграм'),
            div(
              { fontSize: 14, color: '#94A3B8', letterSpacing: 2, textTransform: 'uppercase' },
              eyebrow,
            ),
          ]),
        ]),
        div({ height: 4, width: 80, backgroundColor: BRAND, borderRadius: 2, marginTop: 8 }, ''),
      ]),
      div(
        {
          fontSize: title.length > 80 ? 42 : title.length > 50 ? 52 : 64,
          fontWeight: 700,
          lineHeight: 1.12,
          letterSpacing: -1,
          color: '#F8FAFC',
          maxWidth: 1072,
          display: 'flex',
        },
        title,
      ),
      div({ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 32 }, [
        div({ fontSize: 22, lineHeight: 1.35, color: '#94A3B8', maxWidth: 760, display: 'flex' }, subtitle),
        div(
          { fontSize: 18, color: '#64748B', letterSpacing: 1, fontWeight: 700, textTransform: 'uppercase' },
          DOMAIN,
        ),
      ]),
    ],
  )
}

/** Длинное описание в карточке не помещается — обрезаем по границе предложения. */
function shorten(text, limit = 150) {
  if (text.length <= limit) return text
  const cut = text.slice(0, limit)
  const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf(', '))
  return `${(stop > 60 ? cut.slice(0, stop) : cut).trimEnd()}…`
}

async function render(jsx, name) {
  const svg = await satori(jsx, {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Inter', data: fontRegular, weight: 400, style: 'normal' },
      { name: 'Inter', data: fontBold, weight: 700, style: 'normal' },
    ],
  })
  writeFileSync(resolve(outDir, name), new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng())
  console.log(`✓ site-excel/public/og/${name}`)
}

await render(
  card({
    eyebrow: 'Приложение из Excel',
    title: 'Excel остаётся Excel’ем. Сделаем из него приложение',
    subtitle:
      'Пришлите таблицу, по которой живёт участок, склад или объект. Через 45 минут вернём работающее приложение с вашими данными. Бесплатно.',
  }),
  'excel-to-app.png',
)

for (const item of CASES) {
  await render(
    card({
      eyebrow: `Кейс · ${item.client}`,
      title: `${item.industry}: из Excel в приложение`,
      subtitle: `${item.facts.join(' · ')}. ${shorten(item.pageDescription, 110)}`,
    }),
    `keysy-${item.slug}.png`,
  )
}

await render(
  card({
    eyebrow: 'Сравнение платформ',
    title: 'Интеграм, Power Apps, Quickbase и конструкторы',
    subtitle: shorten(COMPARE_PAGE.pageDescription),
  }),
  'sravnenie.png',
)

// Путь к каталогу печатаем явно: карточки надо закоммитить, а не пересобирать
// на каждой сборке — рендер зависит от шрифтов в scripts/fonts.
console.log(`\nГотово: ${CASES.length + 2} карточки в ${pathToFileURL(outDir).pathname}`)
