// Сгенерировано скриптом scripts/generate-blog-posts.mjs — руками не править.
// Источник: blog-v2/src/content/posts/*.md. Обновить: npm run blog-posts.
//
// Свежие статьи блога для слайдера на главной (issue #512). Блог — отдельная
// Astro-сборка на ideav.ru/blog, поэтому список «запекается» в данные на этапе
// сборки: файл импортируют и React (src/components/BlogSlider.tsx), и Node-скрипт
// пререндера главной (scripts/prerender-landing.mjs). Типы — src/data/blogPosts.d.ts.

export const BLOG_URL = 'https://ideav.ru/blog'

export const BLOG_POSTS = [
  {
    slug: 'ierarhicheskii-oltp-izmeryaem-sleduyushchii-uroven-unifikacii',
    url: 'https://ideav.ru/blog/posts/ierarhicheskii-oltp-izmeryaem-sleduyushchii-uroven-unifikacii/',
    title: 'Иерархический OLTP: измеряем следующий уровень унификации',
    description: 'Выносим разрезы аналитики на верхний уровень транзакции в квартетной модели: 1 млн транзакций, Postgres 16, честные цифры выигрышей и проигрышей.',
    date: '2026-09-10',
    dateLabel: '10 сентября 2026',
    category: 'Технологии',
    image: 'https://ideav.ru/blog/abstract/blog-material-1.svg',
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
  {
    slug: 'pravila-kotorye-nelzya-narushit',
    url: 'https://ideav.ru/blog/posts/pravila-kotorye-nelzya-narushit/',
    title: 'Правила, которые нельзя нарушить: как сделать разработку сходящейся',
    description: 'Почему одни и те же дефекты возвращаются тикетами, даже когда задачи поставлены внятно, и как перестроить процесс — реестр инвариантов, единая граница записи, тест «входы × правила» и обязательный гейт. Практика из наших проектов и типовых случаев.',
    date: '2026-07-27',
    dateLabel: '27 июля 2026',
    category: 'Разработка',
    image: 'https://ideav.ru/blog/uploads/pravila-invarianty-cover.png',
  },
  {
    slug: 'pure-business-design-chistoe-biznes-proektirovanie',
    url: 'https://ideav.ru/blog/posts/pure-business-design-chistoe-biznes-proektirovanie/',
    title: 'Pure Business Design: приложение по описанию задачи, без блоков и кубиков',
    description: 'Чистое бизнес-проектирование — когда пользователь думает только о логике своего дела, а структуру базы, связи, роли, меню и интерфейс проектирует ИИ-агент. Чем это отличается от визуальных конструкторов и от ИИ-ассистентов, которым нужен человек на каждой итерации.',
    date: '2026-07-24',
    dateLabel: '24 июля 2026',
    category: 'О платформе',
    image: 'https://ideav.ru/blog/uploads/og/hero-ai-background.jpg',
  },
  {
    slug: 'semeynyi-byudzhet-v-integrame',
    url: 'https://ideav.ru/blog/posts/semeynyi-byudzhet-v-integrame/',
    title: 'Семейный бюджет в Интеграме: от Excel к приложению за один запрос',
    description: 'Как собрать семейный бюджет в Интеграме — разбор готового приложения по экранам. Счета с автоподсчётом остатка, план и факт по категориям, цели накопления, долги и рассрочки, регулярные платежи одной кнопкой и фото чека к операции. Со скриншотами каждого экрана и объяснением, как это устроено.',
    date: '2026-07-17',
    dateLabel: '17 июля 2026',
    category: 'Проекты',
    image: 'https://ideav.ru/blog/uploads/og/semeynyi-byudzhet-svodka.jpg',
  },
  {
    slug: 'bezopasnost-i-otkazoustoichivost-dlya-krupnogo-biznesa',
    url: 'https://ideav.ru/blog/posts/bezopasnost-i-otkazoustoichivost-dlya-krupnogo-biznesa/',
    title: 'Безопасность и отказоустойчивость Интеграма: данные крупного бизнеса под контролем',
    description: 'Как в Интеграме устроена защита данных от посторонних и от потери: обычная СУБД, гибкая топология развёртывания, шифрование и георезервирование, а главное — выгрузка данных в Excel и реляционную БД без вендор-лока.',
    date: '2026-07-16',
    dateLabel: '16 июля 2026',
    category: 'О платформе',
    image: 'https://ideav.ru/blog/abstract/blog-material-1.svg',
  },
  {
    slug: 'integram-fc-chto-poluchilos-razbor-po-ekranam',
    url: 'https://ideav.ru/blog/posts/integram-fc-chto-poluchilos-razbor-po-ekranam/',
    title: 'ИНТЕГРАМ FC изнутри: разбираем готовое приложение по экранам',
    description: 'Подробный разбор готового приложения «ИНТЕГРАМ FC» — вирусного футбольного антитотализатора, который ИИ собрал за двадцать минут. Со скриншотами каждого экрана: дэшборд-табло, матчи, команды, турнирные таблицы, ставки в антиформате и вирусные звания. Часть 2: что получилось.',
    date: '2026-06-27',
    dateLabel: '27 июня 2026',
    category: 'Проекты',
    image: 'https://ideav.ru/blog/uploads/og/integram-fc-dashboard.jpg',
  },
  {
    slug: 'integram-fc-kak-delali-ot-zayavki-do-prilozheniya',
    url: 'https://ideav.ru/blog/posts/integram-fc-kak-delali-ot-zayavki-do-prilozheniya/',
    title: 'ИНТЕГРАМ FC: как из одного абзаца заказчика вырос вирусный антитотализатор',
    description: 'История одного проекта от начала и до конца — как ИИ превратил абзац «сделай игру, которая будет вируситься» в техзадание, а потом в работающее приложение со схемой данных, ролями и тестовыми данными. Часть 1: как делали.',
    date: '2026-06-27',
    dateLabel: '27 июня 2026',
    category: 'Проекты',
    image: 'https://ideav.ru/blog/uploads/og/integram-fc-tables.jpg',
  },
]
