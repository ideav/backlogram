// Сгенерировано скриптом scripts/generate-blog-posts.mjs — руками не править.
// Источник: blog-v2/src/content/posts/*.md. Обновить: npm run blog-posts.
//
// Свежие статьи блога для слайдера на главной (issue #512). Блог — отдельная
// Astro-сборка на ideav.ru/blog, поэтому список «запекается» в данные на этапе
// сборки: файл импортируют и React (src/components/BlogSlider.tsx), и Node-скрипт
// пререндера главной (scripts/prerender-landing.mjs). Типы — src/data/blogPosts.d.ts.
//
// Статьи с датой позже дня сборки лежат здесь заранее, а показывает их
// visibleBlogPosts() — с наступлением их дня по Москве (issue #726).

export const BLOG_URL = 'https://ideav.ru/blog'

/** День сборки: список собран «на него» (tests/issue-512-blog-slider.test.mjs). */
export const BLOG_POSTS_AS_OF = '2026-10-21'

export const SLIDER_LIMIT = 9

export const BLOG_POSTS = [
  {
    slug: '10-priznakov-chto-tablice-pora-stat-bazoj-dannyh',
    url: 'https://ideav.ru/blog/posts/10-priznakov-chto-tablice-pora-stat-bazoj-dannyh/',
    title: '10 признаков, что таблице пора стать базой данных',
    description: 'Таблица тормозит, близка к лимиту ячеек, заявки в ней ведут пятеро? Чек-лист из 10 признаков: как проверить свою таблицу и что делать дальше.',
    date: '2026-10-24',
    dateLabel: '24 октября 2026',
    category: 'Обучение',
    image: 'https://ideav.ru/blog/uploads/10-priznakov-tablica-baza-cover.png',
  },
  {
    slug: 'gartner-obem-ne-cennost-cena-pilota',
    url: 'https://ideav.ru/blog/posts/gartner-obem-ne-cennost-cena-pilota/',
    title: 'Объём ≠ ценность: почему дешёвый пилот важнее дисциплины',
    description: 'Gartner опросил 2 002 ИТ-директора: значительную ценность от ИИ получили 13%, взлетает один сценарий из пяти. Разбираем, почему дело в цене пилота, а не в дисциплине, и как держать ИИ-агента под контролем.',
    date: '2026-10-21',
    dateLabel: '21 октября 2026',
    category: 'Технологии',
    image: 'https://ideav.ru/blog/abstract/blog-material-2.svg',
  },
  {
    slug: 'podklyuchaem-claude-k-baze-dannyh-cherez-mcp',
    url: 'https://ideav.ru/blog/posts/podklyuchaem-claude-k-baze-dannyh-cherez-mcp/',
    title: 'Подключаем Claude к базе данных через MCP: инструкция',
    description: 'Как подключить Claude Desktop и Claude Code к базе Интеграма через MCP-сервер integram-mcp: конфиг, команды, проверка и что делать, если сервер не добавился.',
    date: '2026-10-20',
    dateLabel: '20 октября 2026',
    category: 'Обучение',
    image: 'https://ideav.ru/blog/uploads/claude-mcp-cover.png',
  },
  {
    slug: 'google-tablicy-2026-riski-i-kuda-perenesti',
    url: 'https://ideav.ru/blog/posts/google-tablicy-2026-riski-i-kuda-perenesti/',
    title: 'Google Таблицы в 2026: риски и куда перенести таблицы',
    description: 'Что известно о рисках для Google Таблиц в России в 2026 году, какие таблицы переносить первыми и когда хватит Яндекс Таблиц или МойОфис, а когда нужна база.',
    date: '2026-10-16',
    dateLabel: '16 октября 2026',
    category: 'О платформе',
    image: 'https://ideav.ru/blog/uploads/google-tablicy-cover.png',
  },
  {
    slug: 'kak-sdelat-prilozhenie-iz-excel-tablicy-poshagovo',
    url: 'https://ideav.ru/blog/posts/kak-sdelat-prilozhenie-iz-excel-tablicy-poshagovo/',
    title: 'Приложение из Excel без программирования: пошагово',
    description: 'Как сделать приложение из Excel-таблицы с базой данных онлайн и веб-формами: что подготовить, что делает ИИ-агент за 45 минут и как проверить результат.',
    date: '2026-10-12',
    dateLabel: '12 октября 2026',
    category: 'Обучение',
    image: 'https://ideav.ru/blog/uploads/og/excel-to-app-zayavki-formy.jpg',
  },
  {
    slug: 'dashbordy-integram-prodazhi-personal-byudzhet',
    url: 'https://ideav.ru/blog/posts/dashbordy-integram-prodazhi-personal-byudzhet/',
    title: 'Дашборд для собственника: продажи, команда и деньги компании на одном экране',
    description: 'Как собрать данные из Битрикс24, 1С и Google-таблиц в один дашборд для собственника: продажи, найм и бюджет без ручных сводок. Разбор на обезличенной копии реального проекта.',
    date: '2026-10-06',
    dateLabel: '6 октября 2026',
    category: 'О платформе',
    image: 'https://ideav.ru/blog/uploads/og/dashboard-finance.jpg',
  },
  {
    slug: 'strategicheskaya-cel-integrama',
    url: 'https://ideav.ru/blog/posts/strategicheskaya-cel-integrama/',
    title: 'Куда мы ведём Интеграм',
    description: 'ИИ живёт внутри данных компании, а не в чате сбоку от них. А настроенный и наполненный Интеграм — это цифровой близнец вашей деловой экспертности.',
    date: '2026-10-03',
    dateLabel: '3 октября 2026',
    category: 'О платформе',
    image: 'https://ideav.ru/blog/abstract/blog-material-1.svg',
  },
  {
    slug: 'ierarhicheskii-oltp-izmeryaem-sleduyushchii-uroven-unifikacii',
    url: 'https://ideav.ru/blog/posts/ierarhicheskii-oltp-izmeryaem-sleduyushchii-uroven-unifikacii/',
    title: 'Иерархический OLTP: измеряем следующий уровень унификации',
    description: 'Выносим разрезы аналитики на верхний уровень транзакции в квартетной модели: 1 млн транзакций, Postgres 16, честные цифры выигрышей и проигрышей.',
    date: '2026-09-10',
    dateLabel: '10 сентября 2026',
    category: 'Технологии',
    image: 'https://ideav.ru/blog/abstract/blog-material-2.svg',
  },
  {
    slug: 'odin-kontragent-tri-vzglyada',
    url: 'https://ideav.ru/blog/posts/odin-kontragent-tri-vzglyada/',
    title: 'Бухгалтерия, продажи и закупки спорят об одном контрагенте. Кто из них прав?',
    description: 'Одной компании-контрагенту бухгалтерии нужен один ИНН, продажам — три подразделения с отдельными менеджерами, закупкам — поставщик с договорами. В большинстве систем этот спор заканчивается компромиссом, неудобным никому. Рассказываем, как устроено, когда правы все, — простыми словами.',
    date: '2026-09-07',
    dateLabel: '7 сентября 2026',
    category: 'О платформе',
    image: 'https://ideav.ru/blog/uploads/kontragent-tri-vzglyada-kdpv.png',
  },
  {
    slug: 'promyshlennoe-prilozhenie-shansy-riski-trudoemkost',
    url: 'https://ideav.ru/blog/posts/promyshlennoe-prilozhenie-shansy-riski-trudoemkost/',
    title: 'Оценка в 300 часов: как взвесить шансы, риски и трудоёмкость промышленного приложения',
    description: 'Разбор реальной оценки: 40 экранов, 77 эндпоинтов, 90 действий — откуда берутся 300 часов и почему «сгенерируется за пару часов» этому не противоречит. Данные исследований о том, где стопорятся те, кто собирает систему сам, и три модели разработки одной и той же системы с цифрами.',
    date: '2026-07-28',
    dateLabel: '28 июля 2026',
    category: 'Разработка',
    image: 'https://ideav.ru/blog/uploads/trudoemkost-90-deistvii-cover.png',
  },
]

/** Сегодня по Москве, YYYY-MM-DD — как moscowDay() в blog-v2/src/lib/published.mjs. */
function moscowDay(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

/** Статьи, вышедшие к дню `today`, — то, что видит посетитель. */
export function visibleBlogPosts(today = moscowDay()) {
  return BLOG_POSTS.filter((post) => post.date <= today).slice(0, SLIDER_LIMIT)
}
