// Сгенерировано скриптом scripts/generate-blog-posts.mjs — руками не править.
// Источник: blog-v2/src/content/posts/*.md. Обновить: npm run blog-posts.
//
// Свежие статьи блога для слайдера на главной (issue #512). Блог — отдельная
// Astro-сборка на blog.ideav.ru, поэтому список «запекается» в данные на этапе
// сборки: файл импортируют и React (src/components/BlogSlider.tsx), и Node-скрипт
// пререндера главной (scripts/prerender-landing.mjs). Типы — src/data/blogPosts.d.ts.

export const BLOG_URL = 'https://blog.ideav.ru'

export const BLOG_POSTS = [
  {
    slug: 'promyshlennoe-prilozhenie-shansy-riski-trudoemkost',
    url: 'https://blog.ideav.ru/posts/promyshlennoe-prilozhenie-shansy-riski-trudoemkost/',
    title: 'Оценка в 300 часов: как взвесить шансы, риски и трудоёмкость промышленного приложения',
    description: 'Разбор реальной оценки: 40 экранов, 77 эндпоинтов, 90 действий — откуда берутся 300 часов и почему «сгенерируется за пару часов» этому не противоречит. Данные исследований о том, где стопорятся те, кто собирает систему сам, и три модели разработки одной и той же системы с цифрами.',
    date: '2026-07-28',
    dateLabel: '28 июля 2026',
    category: 'Разработка',
    image: 'https://blog.ideav.ru/uploads/trudoemkost-90-deistvii-cover.png',
  },
  {
    slug: 'pravila-kotorye-nelzya-narushit',
    url: 'https://blog.ideav.ru/posts/pravila-kotorye-nelzya-narushit/',
    title: 'Правила, которые нельзя нарушить: как сделать разработку сходящейся',
    description: 'Почему одни и те же дефекты возвращаются тикетами, даже когда задачи поставлены внятно, и как перестроить процесс — реестр инвариантов, единая граница записи, тест «входы × правила» и обязательный гейт. Практика из наших проектов и типовых случаев.',
    date: '2026-07-27',
    dateLabel: '27 июля 2026',
    category: 'Разработка',
    image: 'https://blog.ideav.ru/uploads/pravila-invarianty-cover.png',
  },
  {
    slug: 'pure-business-design-chistoe-biznes-proektirovanie',
    url: 'https://blog.ideav.ru/posts/pure-business-design-chistoe-biznes-proektirovanie/',
    title: 'Pure Business Design: приложение по описанию задачи, без блоков и кубиков',
    description: 'Чистое бизнес-проектирование — когда пользователь думает только о логике своего дела, а структуру базы, связи, роли, меню и интерфейс проектирует ИИ-агент. Чем это отличается от визуальных конструкторов и от ИИ-ассистентов, которым нужен человек на каждой итерации.',
    date: '2026-07-24',
    dateLabel: '24 июля 2026',
    category: 'О платформе',
    image: 'https://blog.ideav.ru/uploads/og/hero-ai-background.jpg',
  },
  {
    slug: 'semeynyi-byudzhet-v-integrame',
    url: 'https://blog.ideav.ru/posts/semeynyi-byudzhet-v-integrame/',
    title: 'Семейный бюджет в Интеграме: от Excel к приложению за один запрос',
    description: 'Как собрать семейный бюджет в Интеграме — разбор готового приложения по экранам. Счета с автоподсчётом остатка, план и факт по категориям, цели накопления, долги и рассрочки, регулярные платежи одной кнопкой и фото чека к операции. Со скриншотами каждого экрана и объяснением, как это устроено.',
    date: '2026-07-17',
    dateLabel: '17 июля 2026',
    category: 'Проекты',
    image: 'https://blog.ideav.ru/uploads/og/semeynyi-byudzhet-svodka.jpg',
  },
  {
    slug: 'bezopasnost-i-otkazoustoichivost-dlya-krupnogo-biznesa',
    url: 'https://blog.ideav.ru/posts/bezopasnost-i-otkazoustoichivost-dlya-krupnogo-biznesa/',
    title: 'Безопасность и отказоустойчивость Интеграма: данные крупного бизнеса под контролем',
    description: 'Как в Интеграме устроена защита данных от посторонних и от потери: обычная СУБД, гибкая топология развёртывания, шифрование и георезервирование, а главное — выгрузка данных в Excel и реляционную БД без вендор-лока.',
    date: '2026-07-16',
    dateLabel: '16 июля 2026',
    category: 'О платформе',
    image: 'https://blog.ideav.ru/abstract/blog-material-5.svg',
  },
  {
    slug: 'integram-fc-chto-poluchilos-razbor-po-ekranam',
    url: 'https://blog.ideav.ru/posts/integram-fc-chto-poluchilos-razbor-po-ekranam/',
    title: 'ИНТЕГРАМ FC изнутри: разбираем готовое приложение по экранам',
    description: 'Подробный разбор готового приложения «ИНТЕГРАМ FC» — вирусного футбольного антитотализатора, который ИИ собрал за двадцать минут. Со скриншотами каждого экрана: дэшборд-табло, матчи, команды, турнирные таблицы, ставки в антиформате и вирусные звания. Часть 2: что получилось.',
    date: '2026-06-27',
    dateLabel: '27 июня 2026',
    category: 'Проекты',
    image: 'https://blog.ideav.ru/uploads/og/integram-fc-dashboard.jpg',
  },
  {
    slug: 'integram-fc-kak-delali-ot-zayavki-do-prilozheniya',
    url: 'https://blog.ideav.ru/posts/integram-fc-kak-delali-ot-zayavki-do-prilozheniya/',
    title: 'ИНТЕГРАМ FC: как из одного абзаца заказчика вырос вирусный антитотализатор',
    description: 'История одного проекта от начала и до конца — как ИИ превратил абзац «сделай игру, которая будет вируситься» в техзадание, а потом в работающее приложение со схемой данных, ролями и тестовыми данными. Часть 1: как делали.',
    date: '2026-06-27',
    dateLabel: '27 июня 2026',
    category: 'Проекты',
    image: 'https://blog.ideav.ru/uploads/og/integram-fc-tables.jpg',
  },
  {
    slug: 'massovoe-sopostavlenie-katalogov',
    url: 'https://blog.ideav.ru/posts/massovoe-sopostavlenie-katalogov/',
    title: 'Массовое сопоставление каталогов в Интеграме: автоматический подбор пар',
    description: 'Продолжаем тему сопоставления каталогов: массовый автоподбор в несколько потоков, как считается оценка точности, кандидаты-альтернативы, выгрузка в Excel и доуточнение шорт-листа языковой моделью — без программирования.',
    date: '2026-06-23',
    dateLabel: '23 июня 2026',
    category: 'Обучение',
    image: 'https://blog.ideav.ru/uploads/og/e09f9acc-matching-results.jpg',
  },
  {
    slug: 'ii-chat-vnutri-bazy-agent-dorabatyvaet-prilozhenie',
    url: 'https://blog.ideav.ru/posts/ii-chat-vnutri-bazy-agent-dorabatyvaet-prilozhenie/',
    title: 'ИИ-чат внутри приложения: тот же агент дорабатывает базу изнутри',
    description: 'В каждой базе Интеграма появился ИИ-чат, который вызывает того же агента-разработчика — он дорабатывает приложение прямо изнутри. Рассказываем, как это выглядит, что можно просить и как устроены доступ и безопасность.',
    date: '2026-06-17',
    dateLabel: '17 июня 2026',
    category: 'О платформе',
    image: 'https://blog.ideav.ru/uploads/og/ii-chat-vnutri-bazy.jpg',
  },
]
