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
    slug: 'google-tablicy-2026-riski-i-kuda-perenesti',
    url: 'https://ideav.ru/blog/posts/google-tablicy-2026-riski-i-kuda-perenesti/',
    title: 'Google Таблицы в 2026: риски и куда перенести таблицы',
    description: 'Что известно о рисках для Google Таблиц в России в 2026 году, какие таблицы переносить первыми и когда хватит Яндекс Таблиц или МойОфис, а когда нужна база.',
    date: '2026-10-16',
    dateLabel: '16 октября 2026',
    category: 'О платформе',
    image: 'https://ideav.ru/blog/abstract/blog-material-1.svg',
  },
  {
    slug: 'kak-sdelat-prilozhenie-iz-excel-tablicy-poshagovo',
    url: 'https://ideav.ru/blog/posts/kak-sdelat-prilozhenie-iz-excel-tablicy-poshagovo/',
    title: 'Приложение из Excel без программирования: пошагово',
    description: 'Как сделать приложение из Excel-таблицы с базой данных онлайн и веб-формами: что подготовить, что делает ИИ-агент за 45 минут и как проверить результат.',
    date: '2026-10-12',
    dateLabel: '12 октября 2026',
    category: 'Обучение',
    image: 'https://ideav.ru/blog/abstract/blog-material-2.svg',
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
    image: 'https://ideav.ru/blog/abstract/blog-material-4.svg',
  },
  {
    slug: 'ierarhicheskii-oltp-izmeryaem-sleduyushchii-uroven-unifikacii',
    url: 'https://ideav.ru/blog/posts/ierarhicheskii-oltp-izmeryaem-sleduyushchii-uroven-unifikacii/',
    title: 'Иерархический OLTP: измеряем следующий уровень унификации',
    description: 'Выносим разрезы аналитики на верхний уровень транзакции в квартетной модели: 1 млн транзакций, Postgres 16, честные цифры выигрышей и проигрышей.',
    date: '2026-09-10',
    dateLabel: '10 сентября 2026',
    category: 'Технологии',
    image: 'https://ideav.ru/blog/abstract/blog-material-5.svg',
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
]
