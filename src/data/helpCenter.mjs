// Сайт помощи /help.html — сборка разделов (backlogram#946, эпик ideav/crm#5603).
//
// Отсюда берут содержимое ОБА представления страницы:
//   • React-страница src/pages/HelpCenter.tsx (консультант, поиск, оглавление);
//   • статический снапшот scripts/prerender-help.mjs (краулеры, клиенты без JS).
// Разделы лежат в src/data/help/<id>.mjs по формату src/data/help/SCHEMA.md;
// новый раздел — файл + строка в HELP_SECTIONS.

import { HELP_INTRO } from './help/intro.mjs'
import { SECTION as structure } from './help/structure.mjs'
import { SECTION as data } from './help/data.mjs'
import { SECTION as queries } from './help/queries.mjs'
import { SECTION as templater } from './help/templater.mjs'
import { SECTION as access } from './help/access.mjs'
import { SECTION as automation } from './help/automation.mjs'
import { SECTION as api } from './help/api.mjs'
import { SECTION as recipes } from './help/recipes.mjs'
// Приёмы из рабочих баз (backlogram#955), обезличенные; разложены по id раздела.
import { PRACTICE } from './help/practice.mjs'

export { HELP_INTRO }

export const HELP_META = {
  path: '/help.html',
  title: 'Помощь по Интеграму: как сделать по шагам',
  h1: 'Помощь по Интеграму',
  // Даты для datePublished/dateModified и строки «Обновлено» (backlogram#959):
  // updated двигать при содержательной правке разделов, не при каждой сборке.
  published: '2026-11-21',
  updated: '2026-11-21',
  // До ~158 символов — пиксельный лимит сниппета (issue #516).
  description:
    'Как сделать в Интеграме структуру, запросы, шаблоны, роли, кнопки и интеграции — по шагам, с примерами. Консультант по базе знаний и поиск по всем приёмам.',
  keywords:
    'помощь Интеграм, справка Интеграм, как сделать в Интеграме, конструктор приложений инструкция, структура данных, запросы, шаблонизатор, роли и права, кнопки, триггеры, API, MCP',
}

/** Порядок разделов на странице. Рецепты — первыми: с них начинают на встрече. */
export const HELP_SECTIONS = [recipes, structure, data, queries, templater, access, automation, api].map((s) => ({
  ...s,
  articles: [...s.articles, ...(PRACTICE[s.id] ?? [])],
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
