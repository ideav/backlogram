#!/usr/bin/env node
/**
 * Картинки для объявлений Директа excel-to-app (issue #690).
 *
 * До 08.10 ни у одного из 1416 объявлений не было картинки: в РСЯ такое
 * объявление попадает только в текстовые блоки. Здесь — яркие картинки под
 * четыре посыла (главная, практикум, адепты, партнёры), по три на посыл:
 * два квадрата 1:1 для ротации и один широкий 16:9.
 *
 * Путь рендера тот же, что у OG-карточек (`generate-excel-og.mjs`):
 * Satori → resvg, браузер не нужен. Требования Директа: квадрат от 450 px,
 * широкая — от 1080×607, файл до 10 МБ.
 *
 * PNG кладутся в `site-excel/direct-images/` и коммитятся; загрузку в кабинет
 * и привязку к объявлениям делает `direct-attach-images.mjs`.
 *
 *   npm run direct-images
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'
import satori from 'satori'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = resolve(__dirname, '../site-excel/direct-images')
mkdirSync(outDir, { recursive: true })

const fonts = [
  { name: 'Inter', data: readFileSync(resolve(__dirname, 'fonts/Inter-Regular.ttf')), weight: 400, style: 'normal' },
  { name: 'Inter', data: readFileSync(resolve(__dirname, 'fonts/Inter-Bold.ttf')), weight: 700, style: 'normal' },
]

const div = (style, children = '') => ({ type: 'div', props: { style: { display: 'flex', ...style }, children } })

const EXCEL_GREEN = '#107C41'

/** Лист Excel: зелёная шапка, сетка, пара подсвеченных ячеек. */
function sheet(scale = 1, tilt = -6) {
  const cell = (w, bg = '#FFFFFF', text = '') =>
    div(
      {
        width: w * scale,
        height: 34 * scale,
        backgroundColor: bg,
        borderRight: `${scale}px solid #D7DEE6`,
        borderBottom: `${scale}px solid #D7DEE6`,
        alignItems: 'center',
        paddingLeft: 8 * scale,
        fontSize: 15 * scale,
        color: '#334155',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      },
      text,
    )
  const rows = [
    ['Клиент', 'Сумма', 'Статус'],
    ['ООО «Ромашка»', '128 000', 'в работе'],
    ['ИП Петров', '54 300', 'оплачен'],
    ['АО «Вектор»', '310 000', 'новый'],
    ['ООО «Сфера»', '76 900', 'в работе'],
    ['ИП Козлова', '12 450', 'оплачен'],
  ]
  const hl = { '1-2': '#FEF08A', '3-1': '#BBF7D0', '4-2': '#FECACA' }
  return div(
    {
      flexDirection: 'column',
      backgroundColor: '#FFFFFF',
      borderRadius: 14 * scale,
      overflow: 'hidden',
      boxShadow: '0 24px 48px rgba(15,23,42,0.35)',
      transform: `rotate(${tilt}deg)`,
    },
    [
      div(
        { backgroundColor: EXCEL_GREEN, height: 40 * scale, alignItems: 'center', paddingLeft: 14 * scale, gap: 8 * scale },
        [
          div({ width: 22 * scale, height: 22 * scale, borderRadius: 4 * scale, backgroundColor: '#FFFFFF', color: EXCEL_GREEN, fontSize: 15 * scale, fontWeight: 700, alignItems: 'center', justifyContent: 'center' }, 'X'),
          div({ color: '#FFFFFF', fontSize: 15 * scale, fontWeight: 700 }, 'заказы_final_v7.xlsx'),
        ],
      ),
      ...rows.map((r, i) =>
        div(
          { flexDirection: 'row' },
          r.map((t, j) =>
            cell([150, 96, 92][j], i === 0 ? '#E8F3EC' : hl[`${i}-${j}`] || '#FFFFFF', t),
          ),
        ),
      ),
    ],
  )
}

/** Приложение: шапка, канбан из цветных карточек, столбики графика. */
function app(scale = 1, tilt = 4) {
  const s = n => n * scale
  const card = (c, w = 86) =>
    div({ width: s(w), height: s(30), borderRadius: s(8), backgroundColor: c, opacity: 0.95 })
  const col = (title, color, cards) =>
    div({ flexDirection: 'column', gap: s(8), padding: s(10), backgroundColor: '#F1F5F9', borderRadius: s(12) }, [
      div({ fontSize: s(13), fontWeight: 700, color }, title),
      ...cards.map(c => card(c)),
    ])
  return div(
    {
      flexDirection: 'column',
      backgroundColor: '#FFFFFF',
      borderRadius: s(20),
      overflow: 'hidden',
      boxShadow: '0 28px 60px rgba(15,23,42,0.4)',
      transform: `rotate(${tilt}deg)`,
    },
    [
      div({ height: s(44), backgroundColor: '#1E293B', alignItems: 'center', paddingLeft: s(16), gap: s(8) }, [
        div({ width: s(12), height: s(12), borderRadius: 99, backgroundColor: '#F87171' }),
        div({ width: s(12), height: s(12), borderRadius: 99, backgroundColor: '#FBBF24' }),
        div({ width: s(12), height: s(12), borderRadius: 99, backgroundColor: '#34D399' }),
        div({ marginLeft: s(12), color: '#E2E8F0', fontSize: s(15), fontWeight: 700 }, 'Заказы · приложение'),
      ]),
      div({ padding: s(16), gap: s(12), flexDirection: 'row' }, [
        col('Новые', '#2563EB', ['#93C5FD', '#BFDBFE']),
        col('В работе', '#D97706', ['#FCD34D', '#FDE68A', '#FCD34D']),
        col('Оплачено', '#059669', ['#6EE7B7']),
      ]),
      div({ paddingLeft: s(16), paddingRight: s(16), paddingBottom: s(16), alignItems: 'flex-end', gap: s(10), height: s(96) }, [
        ...[38, 56, 44, 70, 62, 84].map((h, i) =>
          div({ width: s(36), height: s(h), borderRadius: s(6), backgroundImage: `linear-gradient(180deg, ${['#818CF8', '#F472B6', '#38BDF8', '#A78BFA', '#FB923C', '#34D399'][i]}, #6366F1)` }),
        ),
      ]),
    ],
  )
}

/** Круг со стрелкой между таблицей и приложением. */
const arrow = (size = 84) =>
  div(
    {
      width: size,
      height: size,
      borderRadius: 999,
      backgroundColor: '#FDE047',
      color: '#1E293B',
      fontSize: size * 0.55,
      fontWeight: 700,
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
    },
    '→',
  )

const badge = (text, bg = '#FDE047', color = '#1E293B', size = 30) =>
  div(
    { backgroundColor: bg, color, fontSize: size, fontWeight: 700, padding: `${size * 0.35}px ${size * 0.7}px`, borderRadius: 999 },
    text,
  )

const brand = (size = 26, color = '#FFFFFF') =>
  div({ alignItems: 'center', gap: size * 0.5 }, [
    div({ width: size * 1.6, height: size * 1.6, borderRadius: size * 0.4, backgroundColor: '#FFFFFF', color: '#307FE2', fontSize: size * 1.05, fontWeight: 700, alignItems: 'center', justifyContent: 'center' }, 'И'),
    div({ fontSize: size, fontWeight: 700, color }, 'Интеграм · excel-to-app.ru'),
  ])

/** Неразрывные пробелы: короткий предлог не висит в конце строки, тире не начинает строку. */
const nb = t => t.replace(/ —/g, ' —').replace(/(^| )(за|в|и|с|на|до|по|из|от) /gi, '$1$2 ')
const headline = (text, size, color = '#FFFFFF', maxWidth) =>
  div({ fontSize: size, fontWeight: 700, lineHeight: 1.08, letterSpacing: -1.5, color, ...(maxWidth && { maxWidth }) }, nb(text))

/** Мягкие цветные пятна поверх градиента — фон «живее» плоской заливки. */
const blobs = (a, b) =>
  `radial-gradient(circle at 85% 12%, ${a} 0%, transparent 42%), radial-gradient(circle at 8% 92%, ${b} 0%, transparent 48%)`

const bg = (from, to, a, b) => ({
  backgroundColor: from,
  backgroundImage: `${blobs(a, b)}, linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
})

/** Квадрат «таблица → приложение». */
function squareConvert({ colors, title, sub, tag }) {
  return div(
    { width: 1080, height: 1080, flexDirection: 'column', justifyContent: 'space-between', padding: 72, fontFamily: 'Inter', ...bg(...colors) },
    [
      div({ justifyContent: 'space-between', alignItems: 'center' }, [brand(26), badge(tag, '#FDE047', '#1E293B', 28)]),
      div({ alignItems: 'center', justifyContent: 'center', gap: 28, marginTop: 20 }, [sheet(0.95, -7), arrow(88), app(0.92, 5)]),
      div({ flexDirection: 'column', gap: 18 }, [
        headline(title, 76),
        div({ fontSize: 34, color: 'rgba(255,255,255,0.9)', lineHeight: 1.25 }, nb(sub)),
      ]),
    ],
  )
}

/** Квадрат с огромной цифрой — для «45 минут» и «15–40%». */
function squareHero({ colors, big, bigSub, title, tag, art }) {
  return div(
    { width: 1080, height: 1080, flexDirection: 'column', justifyContent: 'space-between', padding: 72, fontFamily: 'Inter', ...bg(...colors) },
    [
      div({ justifyContent: 'space-between', alignItems: 'center' }, [brand(26), badge(tag, '#FFFFFF', '#1E293B', 28)]),
      div({ alignItems: 'center', justifyContent: 'space-between' }, [
        div({ flexDirection: 'column', maxWidth: 600 }, [
          div({ fontSize: big.length > 4 ? 170 : 240, fontWeight: 700, color: '#FFFFFF', letterSpacing: -8, lineHeight: 1, textShadow: '0 10px 40px rgba(0,0,0,0.25)' }, big),
          div({ fontSize: 52, fontWeight: 700, color: '#FDE047', marginTop: 8, lineHeight: 1.15 }, nb(bigSub)),
        ]),
        art,
      ]),
      headline(title, 64),
    ],
  )
}

/** Широкая 16:9: текст слева, иллюстрация справа. */
function wide({ colors, title, sub, tag, art }) {
  return div(
    { width: 1080, height: 607, padding: 52, fontFamily: 'Inter', alignItems: 'center', justifyContent: 'space-between', ...bg(...colors) },
    [
      div({ flexDirection: 'column', justifyContent: 'space-between', height: '100%', width: 500 }, [
        brand(20),
        div({ flexDirection: 'column', gap: 16 }, [headline(title, 48, '#FFFFFF', 500), div({ fontSize: 24, color: 'rgba(255,255,255,0.9)', lineHeight: 1.3 }, nb(sub))]),
        div({}, [badge(tag, '#FDE047', '#1E293B', 22)]),
      ]),
      div({ width: 470, alignItems: 'center', justifyContent: 'center' }, [art]),
    ],
  )
}

/**
 * Иллюстрации владельца из issue #690 (две сетки 4×4, нарезаны в `art/`):
 * `a`/`b` — сетка, дальше строка и столбец. Плитка 425 px — меньше минимума
 * Директа (450), поэтому сама по себе в объявление не идёт, только в макет.
 */
const artDir = resolve(outDir, 'art')
const tile = (name, size, tilt = 0) => ({
  type: 'img',
  props: {
    src: `data:image/png;base64,${readFileSync(resolve(artDir, `${name}.png`)).toString('base64')}`,
    width: size,
    height: size,
    style: { borderRadius: size * 0.09, boxShadow: '0 30px 70px rgba(0,0,0,0.45)', transform: `rotate(${tilt}deg)` },
  },
})

/** Квадрат с иллюстрацией владельца: крупная плитка, под ней заголовок. */
function squareArt({ colors, art, title, sub, tag }) {
  return div(
    { width: 1080, height: 1080, flexDirection: 'column', justifyContent: 'space-between', padding: 72, fontFamily: 'Inter', ...bg(...colors) },
    [
      div({ justifyContent: 'space-between', alignItems: 'center' }, [brand(26), badge(tag, '#FDE047', '#1E293B', 28)]),
      div({ justifyContent: 'center' }, [tile(art, 540, -3)]),
      div({ flexDirection: 'column', gap: 14 }, [
        headline(title, 68),
        div({ fontSize: 32, color: 'rgba(255,255,255,0.9)', lineHeight: 1.25 }, nb(sub)),
      ]),
    ],
  )
}

/** Иллюстрации для практикума / адептов / партнёров. */
function chatToApp(scale = 1) {
  const s = n => n * scale
  const bubble = (text, me) =>
    div(
      {
        alignSelf: me ? 'flex-end' : 'flex-start',
        maxWidth: s(300),
        backgroundColor: me ? '#FFFFFF' : '#1E293B',
        color: me ? '#1E293B' : '#F8FAFC',
        fontSize: s(20),
        lineHeight: 1.3,
        padding: `${s(14)}px ${s(18)}px`,
        borderRadius: s(20),
        boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
      },
      text,
    )
  return div({ flexDirection: 'column', gap: s(16), width: s(380) }, [
    bubble('Вот моя таблица заказов. Хочу приложение для менеджеров', true),
    bubble('Готово: карточки, статусы, отчёт по оплатам ✓', false),
    div({ alignSelf: 'center', marginTop: s(6) }, [app(0.62 * scale, 0)]),
  ])
}

function people(scale = 1) {
  const s = n => n * scale
  const person = (c, size, label) =>
    div({ flexDirection: 'column', alignItems: 'center', gap: s(8) }, [
      div({ width: s(size), height: s(size), borderRadius: 999, backgroundColor: c, border: `${s(6)}px solid #FFFFFF`, alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: s(size * 0.42), fontWeight: 700, boxShadow: '0 12px 28px rgba(0,0,0,0.25)' }, label),
    ])
  return div({ flexDirection: 'column', alignItems: 'center', gap: s(18) }, [
    person('#7C3AED', 150, 'Вы'),
    div({ fontSize: s(40), color: '#FFFFFF', fontWeight: 700 }, '↓ ↓ ↓'),
    div({ gap: s(18) }, [person('#0EA5E9', 96, 'ИИ'), person('#F43F5E', 96, '₽'), person('#10B981', 96, 'ИИ')]),
  ])
}

function coins(scale = 1) {
  const s = n => n * scale
  const stack = (n, x) =>
    div({ flexDirection: 'column-reverse', marginLeft: s(x) }, Array.from({ length: n }, (_, i) =>
      div({ width: s(110), height: s(26), marginTop: s(-8), borderRadius: 999, backgroundImage: 'linear-gradient(180deg, #FDE68A, #F59E0B)', border: `${s(3)}px solid #B45309`, alignItems: 'center', justifyContent: 'center', fontSize: s(16), fontWeight: 700, color: '#92400E' }, i === n - 1 ? '₽' : ''),
    ))
  return div({ alignItems: 'flex-end', gap: s(10) }, [stack(4, 0), stack(7, 0), stack(10, 0)])
}

const IMAGES = [
  // Главная: Excel → приложение за 45 минут.
  ['excel-sq-a.png', 1080, squareConvert({
    colors: ['#4F46E5', '#2563EB', 'rgba(236,72,153,0.55)', 'rgba(56,189,248,0.5)'],
    title: 'Из Excel — в приложение за 45 минут',
    sub: 'Пришлите таблицу — ИИ соберёт рабочее приложение на ваших данных',
    tag: 'Бесплатно',
  })],
  ['excel-sq-b.png', 1080, squareHero({
    colors: ['#F97316', '#DB2777', 'rgba(253,224,71,0.55)', 'rgba(124,58,237,0.5)'],
    big: '45', bigSub: 'минут',
    title: 'и ваша таблица стала приложением',
    tag: 'Демо бесплатно',
    art: div({ flexDirection: 'column', gap: 18, alignItems: 'center' }, [sheet(0.75, -8), div({ fontSize: 56, color: '#FFFFFF', fontWeight: 700 }, '↓'), app(0.7, 4)]),
  })],
  ['excel-wide.png', 607, wide({
    colors: ['#0EA5E9', '#4F46E5', 'rgba(52,211,153,0.5)', 'rgba(236,72,153,0.45)'],
    title: 'Excel → приложение за 45 минут',
    sub: 'Ваши таблицы, статусы и отчёты — в одном удобном приложении',
    tag: 'Бесплатная демонстрация',
    art: div({ alignItems: 'center', gap: 10 }, [sheet(0.5, -7), arrow(44), app(0.5, 5)]),
  })],

  // Практикум: свой ИИ-проект за час.
  ['praktikum-sq-a.png', 1080, squareHero({
    colors: ['#059669', '#0891B2', 'rgba(253,224,71,0.5)', 'rgba(99,102,241,0.5)'],
    big: '1 час', bigSub: 'и свой ИИ-проект готов',
    title: 'Практикум на ваших данных, без программирования',
    tag: 'Практикум',
    art: chatToApp(0.85),
  })],
  ['praktikum-sq-b.png', 1080, squareConvert({
    colors: ['#7C3AED', '#0891B2', 'rgba(52,211,153,0.55)', 'rgba(244,114,182,0.45)'],
    title: 'Свой первый ИИ-проект за час',
    sub: 'Берёте свою таблицу — уходите с работающим приложением',
    tag: 'Без кода',
  })],
  ['praktikum-wide.png', 607, wide({
    colors: ['#10B981', '#2563EB', 'rgba(253,224,71,0.45)', 'rgba(124,58,237,0.5)'],
    title: 'Свой ИИ-проект за час',
    sub: 'Практикум на ваших таблицах. Программировать не нужно',
    tag: 'Записаться на практикум',
    art: chatToApp(0.9),
  })],

  // Адепты: учите других применять ИИ и зарабатывайте.
  ['adept-sq-a.png', 1080, squareHero({
    colors: ['#DB2777', '#7C3AED', 'rgba(251,191,36,0.55)', 'rgba(56,189,248,0.45)'],
    big: 'ИИ', bigSub: 'учите — и зарабатывайте',
    title: 'Станьте адептом: научите других применять ИИ',
    tag: 'Программа адептов',
    art: people(0.8),
  })],
  ['adept-sq-b.png', 1080, squareHero({
    colors: ['#F59E0B', '#E11D48', 'rgba(253,224,71,0.5)', 'rgba(124,58,237,0.5)'],
    big: '₽', bigSub: 'за каждого ученика',
    title: 'Знаете Excel и ИИ? Делитесь — и зарабатывайте',
    tag: 'Стать адептом',
    art: coins(1.1),
  })],
  ['adept-wide.png', 607, wide({
    colors: ['#C026D3', '#4F46E5', 'rgba(251,191,36,0.5)', 'rgba(244,63,94,0.45)'],
    title: 'Учите других применять ИИ',
    sub: 'Станьте адептом Интеграма и зарабатывайте на внедрениях',
    tag: 'Программа адептов',
    art: people(0.75),
  })],

  // Партнёры: 15–40% с выручки за приведённого заказчика.
  ['partner-sq-a.png', 1080, squareHero({
    colors: ['#0F766E', '#4338CA', 'rgba(52,211,153,0.6)', 'rgba(253,224,71,0.4)'],
    big: '15–40%', bigSub: 'с выручки',
    title: 'за каждого заказчика, которого вы привели',
    tag: 'Партнёрам',
    art: coins(0.8),
  })],
  ['partner-sq-b.png', 1080, squareConvert({
    colors: ['#16A34A', '#0369A1', 'rgba(253,224,71,0.5)', 'rgba(167,139,250,0.5)'],
    title: 'Приведите клиента — получите до 40%',
    sub: 'Мы делаем приложения из Excel, вы получаете долю выручки',
    tag: '15–40%',
  })],
  ['partner-wide.png', 607, wide({
    colors: ['#059669', '#4338CA', 'rgba(253,224,71,0.45)', 'rgba(56,189,248,0.45)'],
    title: '15–40% с выручки за заказчика',
    sub: 'Партнёрская программа Интеграма: рекомендуете — зарабатываете',
    tag: 'Стать партнёром',
    art: coins(1.2),
  })],

  // Те же посылы с иллюстрациями владельца (#690): тёмный фиолетовый фон плиток
  // продолжаем тёмным градиентом с яркими пятнами.
  ['excel-art-sq-a.png', 1080, squareArt({
    colors: ['#1E1B4B', '#4C1D95', 'rgba(56,189,248,0.45)', 'rgba(236,72,153,0.45)'],
    art: 'b44', title: 'Таблица → приложение за 45 минут', sub: 'ИИ соберёт рабочее приложение из вашего Excel', tag: 'Бесплатно',
  })],
  ['excel-art-sq-b.png', 1080, squareArt({
    colors: ['#312E81', '#86198F', 'rgba(250,204,21,0.35)', 'rgba(56,189,248,0.45)'],
    art: 'b41', title: 'Ваш Excel — в телефоне и браузере', sub: 'Приложение на ваших данных за 45 минут', tag: 'Демо бесплатно',
  })],
  ['excel-art-wide.png', 607, wide({
    colors: ['#1E1B4B', '#6D28D9', 'rgba(56,189,248,0.45)', 'rgba(236,72,153,0.4)'],
    title: 'Из Excel — в приложение за 45 минут', sub: 'Связанные таблицы, статусы и отчёты вместо файлов-версий', tag: 'Бесплатная демонстрация',
    art: tile('b43', 420, 3),
  })],

  ['praktikum-art-sq-a.png', 1080, squareArt({
    colors: ['#0F172A', '#5B21B6', 'rgba(52,211,153,0.45)', 'rgba(56,189,248,0.4)'],
    art: 'b11', title: 'Свой первый ИИ-проект за час', sub: 'Практикум на ваших таблицах, без программирования', tag: 'Практикум',
  })],
  ['praktikum-art-sq-b.png', 1080, squareArt({
    colors: ['#1E1B4B', '#0E7490', 'rgba(250,204,21,0.4)', 'rgba(167,139,250,0.45)'],
    art: 'b22', title: 'Идея утром — приложение к обеду', sub: 'Час практикума: ИИ строит, вы направляете', tag: 'Без кода',
  })],
  ['praktikum-art-wide.png', 607, wide({
    colors: ['#0F172A', '#7C3AED', 'rgba(52,211,153,0.45)', 'rgba(236,72,153,0.35)'],
    title: 'Свой ИИ-проект за час', sub: 'Практикум на ваших данных. Программировать не нужно', tag: 'Записаться на практикум',
    art: tile('b24', 420, -3),
  })],

  ['adept-art-sq-a.png', 1080, squareArt({
    colors: ['#2E1065', '#9D174D', 'rgba(250,204,21,0.4)', 'rgba(56,189,248,0.4)'],
    art: 'b14', title: 'Учите других применять ИИ', sub: 'Станьте адептом Интеграма и зарабатывайте на этом', tag: 'Программа адептов',
  })],
  ['adept-art-sq-b.png', 1080, squareArt({
    colors: ['#1E1B4B', '#A21CAF', 'rgba(52,211,153,0.4)', 'rgba(250,204,21,0.35)'],
    art: 'b33', title: 'Ведите команды в ИИ — за вознаграждение', sub: 'Программа адептов: обучение, внедрения, доход', tag: 'Стать адептом',
  })],
  ['adept-art-wide.png', 607, wide({
    colors: ['#2E1065', '#BE185D', 'rgba(250,204,21,0.4)', 'rgba(56,189,248,0.4)'],
    title: 'Станьте адептом ИИ', sub: 'Учите других применять ИИ и зарабатывайте на этом', tag: 'Программа адептов',
    art: tile('a14', 420, 3),
  })],

  ['partner-art-sq-a.png', 1080, squareArt({
    colors: ['#022C22', '#4338CA', 'rgba(52,211,153,0.5)', 'rgba(250,204,21,0.35)'],
    art: 'b32', title: '15–40% с выручки за заказчика', sub: 'Партнёрская программа Интеграма', tag: 'Партнёрам',
  })],
  ['partner-art-sq-b.png', 1080, squareArt({
    colors: ['#1E1B4B', '#047857', 'rgba(250,204,21,0.45)', 'rgba(167,139,250,0.45)'],
    art: 'b31', title: 'Рекомендуете — получаете долю', sub: 'До 40% выручки с каждого приведённого клиента', tag: '15–40%',
  })],
  ['partner-art-wide.png', 607, wide({
    colors: ['#022C22', '#4338CA', 'rgba(52,211,153,0.45)', 'rgba(250,204,21,0.35)'],
    title: '15–40% с выручки за заказчика', sub: 'Партнёрская программа: рекомендуете — зарабатываете', tag: 'Стать партнёром',
    art: tile('a32', 420, -3),
  })],
]

for (const [name, height, jsx] of IMAGES.filter(([n]) => !process.env.ONLY || n === process.env.ONLY)) {
  const svg = await satori(jsx, { width: 1080, height, fonts })
  writeFileSync(resolve(outDir, name), new Resvg(svg, { fitTo: { mode: 'width', value: 1080 } }).render().asPng())
  console.log(`✓ site-excel/direct-images/${name}`)
}
