// Сайт помощи /help.html — сборка разделов (backlogram#946, эпик ideav/crm#5603).
//
// Отсюда берут содержимое ОБА представления страницы:
//   • React-страница src/pages/HelpCenter.tsx (консультант, поиск, оглавление);
//   • статический снапшот scripts/prerender-help.mjs (краулеры, клиенты без JS).
// Разделы лежат в src/data/help/<id>.mjs по формату src/data/help/SCHEMA.md;
// новый раздел — файл + строка в HELP_SECTIONS.

import { HELP_INTRO as INTRO } from './help/intro.mjs'
import { SECTION as structure } from './help/structure.mjs'
import { SECTION as data } from './help/data.mjs'
import { SECTION as queries } from './help/queries.mjs'
import { SECTION as templater } from './help/templater.mjs'
import { SECTION as access } from './help/access.mjs'
import { SECTION as automation } from './help/automation.mjs'
import { SECTION as api } from './help/api.mjs'
import { SECTION as recipes } from './help/recipes.mjs'
import { SECTION as onprem } from './help/onprem.mjs'
// Приёмы из рабочих баз (backlogram#955), обезличенные; разложены по id раздела.
import { PRACTICE } from './help/practice.mjs'


export const HELP_META = {
  path: '/help.html',
  title: 'Помощь по Интеграму (Integram): как сделать по шагам',
  h1: 'Помощь по Интеграму',
  // Даты для datePublished/dateModified и строки «Обновлено» (backlogram#959):
  // updated двигать при содержательной правке разделов, не при каждой сборке.
  published: '2026-11-21',
  updated: '2026-11-22',
  // До ~158 символов — пиксельный лимит сниппета (issue #516).
  description:
    'Как сделать в Интеграме (Integram) структуру, запросы, шаблоны, роли, кнопки и интеграции — по шагам, с примерами. Консультант и поиск по всем приёмам.',
  keywords:
    'помощь Интеграм, справка Интеграм, как сделать в Интеграме, конструктор приложений инструкция, структура данных, запросы, шаблонизатор, роли и права, кнопки, триггеры, API, MCP',
}

/**
 * У каждого раздела своя страница /help/<id>.html (backlogram#961): один title и
 * description на 374 приёма не ранжировались и обрезались ИИ-краулерами.
 * /help.html — хаб: ликбез, консультант, поиск и оглавление.
 * pageTitle ≤70, description ≤160 (держит tests/issue-961-help-sections.test.mjs).
 */
const SECTION_SEO = {
  recipes: {
    pageTitle: 'Рецепты Интеграма: CRM, склад, заявки, производство по шагам',
    description:
      'Готовые рецепты Интеграма (Integram) под типовые задачи: CRM и воронка, заявки с канбаном, склад, производство, табель, договоры, закупки — по шагам.',
  },
  structure: {
    pageTitle: 'Структура данных в Интеграме: таблицы, колонки, справочники',
    description:
      'Как в Интеграме (Integram) создать таблицу, колонку, справочник, выпадающий список и подчинённую таблицу, выбрать тип колонки — по шагам, с примерами.',
  },
  data: {
    pageTitle: 'Работа с данными в Интеграме: ввод, фильтры, импорт из Excel',
    description:
      'Ввод и правка записей в Интеграме (Integram), поиск и фильтры, файлы, выгрузка и импорт из Excel, перенос между базами, журнал изменений — по шагам.',
  },
  queries: {
    pageTitle: 'Отчёты и дашборды в Интеграме: запросы, формулы, фильтры',
    description:
      'Как в Интеграме (Integram) собрать отчёт из связанных таблиц, добавить формулу, фильтр и итоги, сделать отчёт за период и дашборд — по шагам.',
  },
  templater: {
    pageTitle: 'Рабочие места и меню в Интеграме: HTML-шаблоны по шагам',
    description:
      'Свои страницы и рабочие места в Интеграме (Integram): HTML-шаблоны с данными запросов, скрипты и стили, меню ролей, главная страница — по шагам.',
  },
  access: {
    pageTitle: 'Роли и права в Интеграме: доступ к таблицам и записям',
    description:
      'Роли и права в Интеграме (Integram): доступ к таблицам и колонкам, «видит только свои записи», пользователи, вход и токены, разбор ошибок 403 — по шагам.',
  },
  automation: {
    pageTitle: 'Кнопки и триггеры в Интеграме: автоматизация по шагам',
    description:
      'Кнопки в таблицах Интеграма (Integram), действия при создании и изменении записи, запросы, которые пишут данные, почта и уведомления — по шагам.',
  },
  api: {
    pageTitle: 'API и интеграции Интеграма: первый вызов, токены, ИИ-агенты',
    description:
      'API Интеграма (Integram): первый вызов, токен для интеграции, чтение и запись записей, коннекторы к Битрикс24, 1С и Google Sheets, ИИ-агенты — по шагам.',
  },
  onprem: {
    pageTitle: 'Своя установка Интеграма (on-premise): договор, бэкапы',
    description:
      'Интеграм (Integram) на своём сервере: право по договору, кто сопровождает платформу, установка, резервные копии по расписанию, перенос базы из облака.',
  },
}

/** Адрес страницы раздела. */
export const helpSectionPath = (id) => `/help/${id}.html`

/** Порядок разделов. Рецепты — первыми: с них начинают на встрече. */
const ORDER = [recipes, structure, data, queries, templater, access, automation, api, onprem]

/** id раздела, которому принадлежит якорь (id приёма начинается с «<раздел>-»), или null. */
export function helpSectionOf(anchor) {
  const a = String(anchor ?? '')
  return ORDER.find((s) => a === s.id || a.startsWith(`${s.id}-`))?.id ?? null
}

/**
 * Ссылка `/help.html#<приём>` → `/help/<раздел>.html#<приём>`. Тексты разделов
 * пишутся со старыми ссылками на хаб, адрес раздела подставляется здесь.
 * Остальные ссылки (и `#basics` хаба) возвращаются как есть.
 */
export function helpHref(href) {
  const m = /^(?:https:\/\/ideav\.ru)?\/help\.html#(.+)$/.exec(String(href ?? ''))
  if (!m) return href
  const section = helpSectionOf(m[1])
  if (!section) return href
  return m[1] === section ? helpSectionPath(section) : `${helpSectionPath(section)}#${m[1]}`
}

const fixLinks = (a) => ({
  ...a,
  links: a.links?.map((l) => ({ ...l, href: helpHref(l.href) })),
  blocks: a.blocks?.map((b) => (b.t === 'note' && b.link ? { ...b, link: { ...b.link, href: helpHref(b.link.href) } } : b)),
})

export const HELP_SECTIONS = ORDER.map((s) => ({
  ...s,
  ...SECTION_SEO[s.id],
  path: helpSectionPath(s.id),
  articles: [...s.articles, ...(PRACTICE[s.id] ?? [])].map(fixLinks),
}))

/** Плоский список статей с привязкой к разделу — для поиска и консультанта. */
export const HELP_ARTICLES = HELP_SECTIONS.flatMap((s) =>
  s.articles.map((a) => ({ ...a, sectionId: s.id, sectionTitle: s.title })),
)

/** Примеры вопросов под полем консультанта. */
export const HELP_SAMPLE_QUESTIONS = [
  'как сделать выпадающий список',
  'чтобы менеджер видел только своих клиентов',
  'отчёт с суммой по месяцам',
  'кнопка, которая меняет статус',
  'загрузить данные из Excel',
  'подключить ИИ-агента к базе',
]

/**
 * Подпись уровня приёма (#5626). У приёма «в интерфейсе» вызовы API вынесены в блоки
 * с `api: true` — подпись говорит, что они есть, а не выдаёт curl за кнопку интерфейса.
 */
export const HELP_API_TITLE = 'То же через API — для ИИ-агента или разработчика'
export function helpLevelLabel(a) {
  if (a.level === 'pro') return 'для разработчика'
  if (a.level !== 'start') return a.level ?? ''
  return a.blocks?.some((b) => b.api) ? 'в интерфейсе · есть API' : 'в интерфейсе'
}
/** Блоки приёма: интерфейсные отдельно от API-шагов (порядок внутри групп сохраняется). */
export function helpSplitBlocks(a) {
  const blocks = a.blocks ?? []
  return { ui: blocks.filter((b) => !b.api), api: blocks.filter((b) => b.api) }
}

/** Ликбез хаба; ссылки плашки «агенты» — на страницы разделов (#5626). */
export const HELP_INTRO = {
  ...INTRO,
  agents: { ...INTRO.agents, links: INTRO.agents.links.map((l) => ({ ...l, href: helpHref(l.href) })) },
}
