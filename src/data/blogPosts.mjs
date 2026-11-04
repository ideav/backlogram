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
export const BLOG_POSTS_AS_OF = '2026-11-04'

export const SLIDER_LIMIT = 9

export const BLOG_POSTS = [
  {
    slug: 'crm-v-excel-kogda-pora-perehodit',
    url: 'https://ideav.ru/blog/posts/crm-v-excel-kogda-pora-perehodit/',
    title: 'CRM в Excel: когда хватит, а когда пора переходить',
    description: 'CRM в Excel для b2b-услуг, стройки и салона: когда таблицы хватает, 8 признаков, что пора уходить, и чем отличается коробочная CRM от своей базы из той же таблицы.',
    date: '2026-11-13',
    dateLabel: '13 ноября 2026',
    category: 'Обучение',
    image: 'https://ideav.ru/blog/uploads/crm-v-excel-cover.png',
  },
  {
    slug: 'pamyat-ii-agenta-bez-vektornoi-bd',
    url: 'https://ideav.ru/blog/posts/pamyat-ii-agenta-bez-vektornoi-bd/',
    title: 'Память ИИ-агента: нужна ли векторная БД или хватит Postgres',
    description: 'Что на самом деле нужно памяти ИИ-агента: pgvector, отдельная векторная БД или связи между записями. Замеры на 19 000 тикетах и грабли Postgres.',
    date: '2026-11-09',
    dateLabel: '9 ноября 2026',
    category: 'Обучение',
    image: 'https://ideav.ru/blog/uploads/pamyat-ii-agenta-cover.png',
  },
  {
    slug: 'menshe-koda-menshe-dyr-bezopasnost-prilozhenij',
    url: 'https://ideav.ru/blog/posts/menshe-koda-menshe-dyr-bezopasnost-prilozhenij/',
    title: 'Меньше кода — меньше дыр: почему приложения на Интеграме безопаснее',
    description: 'В 2025 году опубликовано больше 48 тысяч уязвимостей — рекорд. Большая часть живёт не в ядрах систем, а в коде приложений и плагинов над ними. Разбираем, как Интеграм убирает этот слой: приложение — описание, а не программа.',
    date: '2026-11-04',
    dateLabel: '4 ноября 2026',
    category: 'О платформе',
    image: 'https://ideav.ru/blog/uploads/menshe-koda-menshe-dyr-cover.png',
  },
  {
    slug: 'edinaya-operacionnaya-sreda-dlya-biznesa-i-ii-agentov',
    url: 'https://ideav.ru/blog/posts/edinaya-operacionnaya-sreda-dlya-biznesa-i-ii-agentov/',
    title: 'Единая операционная среда для бизнеса и ИИ-агентов: как местному бизнесу перестать быть невидимым',
    description: 'Агентов становится всё больше, но сантехнику, стоматологии и автосервису нечем с ними разговаривать. Разбираем, почему разрыв в инфраструктуре, а не в моделях, и как единая операционная среда, собранная из Excel-таблицы, даёт работать в одних данных людям, ИИ-чату и внешним агентам.',
    date: '2026-11-02',
    dateLabel: '2 ноября 2026',
    category: 'Технологии',
    image: 'https://ideav.ru/blog/uploads/edinaya-sreda-cover.png',
  },
  {
    slug: 'ii-agenty-ne-oshibayutsya-sobytiynaya-specifikaciya',
    url: 'https://ideav.ru/blog/posts/ii-agenty-ne-oshibayutsya-sobytiynaya-specifikaciya/',
    title: 'Как мы отучили ИИ-агентов угадывать: событийная спецификация вместо «умного агента»',
    description: 'ИИ-агенты ошибаются не от глупости, а потому что правила процесса живут только в их голове. Рассказываем, как онтология и таблица событий делают агентов точнее, дешевле и тиражируемыми.',
    date: '2026-11-02',
    dateLabel: '2 ноября 2026',
    category: 'Технологии',
    image: 'https://ideav.ru/blog/uploads/sobytiynaya-specifikaciya-cover.png',
  },
  {
    slug: 'podklyuchaem-ii-k-baze-po-adresu-agent-ideav-ru-mcp',
    url: 'https://ideav.ru/blog/posts/podklyuchaem-ii-k-baze-po-adresu-agent-ideav-ru-mcp/',
    title: 'Подключаем ИИ к базе ideav.ru по адресу: удалённый MCP agent.ideav.ru/mcp',
    description: 'Как подключить Claude, ChatGPT или другой ИИ-клиент к базе на ideav.ru без установки: адрес agent.ideav.ru/mcp, MCP-токен со страницы базы, права, срок и отзыв.',
    date: '2026-11-02',
    dateLabel: '2 ноября 2026',
    category: 'Обучение',
    image: 'https://ideav.ru/blog/abstract/blog-material-6.svg',
  },
  {
    slug: 'vaib-koding-ili-no-code-chto-vybrat-biznesu',
    url: 'https://ideav.ru/blog/posts/vaib-koding-ili-no-code-chto-vybrat-biznesu/',
    title: 'Вайб-кодинг или no-code: что выбрать бизнесу в 2026',
    description: 'Вайб-кодинг собирает приложение за вечер, но права, база и сопровождение остаются на вас. Где он оправдан, где нужен no-code и при чём здесь ИИ на платформе.',
    date: '2026-11-01',
    dateLabel: '1 ноября 2026',
    category: 'Технологии',
    image: 'https://ideav.ru/blog/uploads/vaib-koding-ili-no-code-cover.png',
  },
  {
    slug: 'kastomizaciya-erp-luchshie-praktiki-pod-vash-biznes',
    url: 'https://ideav.ru/blog/posts/kastomizaciya-erp-luchshie-praktiki-pod-vash-biznes/',
    title: 'Кастомизация ERP: почему «под себя» больше не значит «с нуля»',
    description: 'Кастомизация ERP без боли обновлений: берём функции лучших систем, подгоняем под ваши процессы и добавляем своё. Чем это отличается от доработки коробки и самописки.',
    date: '2026-10-29',
    dateLabel: '29 октября 2026',
    category: 'Обучение',
    image: 'https://ideav.ru/blog/uploads/kastomizaciya-erp-cover.png',
  },
  {
    slug: 'pereezd-iz-airtable-eksport-svyazi-vlozheniya',
    url: 'https://ideav.ru/blog/posts/pereezd-iz-airtable-eksport-svyazi-vlozheniya/',
    title: 'Переезд из Airtable: экспорт, связи, вложения — пошагово',
    description: 'С 19 февраля 2026 года Airtable закрыт для пользователей из России. Как выгрузить базу по таблицам, не потерять связи и файлы и собрать её заново на российском сервере.',
    date: '2026-10-29',
    dateLabel: '29 октября 2026',
    category: 'Обучение',
    image: 'https://ideav.ru/blog/uploads/pereezd-iz-airtable-cover.png',
  },
  {
    slug: 'skladskoi-uchet-i-inventarizaciya',
    url: 'https://ideav.ru/blog/posts/skladskoi-uchet-i-inventarizaciya/',
    title: 'Складской учёт и инвентаризация: как выглядит типовое приложение склада',
    description: 'Готовое приложение склада в Интеграме: номенклатура с минимальным запасом, приход, отгрузка, списание и возврат по документам, автоматический пересчёт остатков с подсветкой дефицита, инвентаризация с автокорректировкой и роли менеджера, кладовщика и руководителя. Демо открыто для входа — внутри разбор по экранам.',
    date: '2026-10-25',
    dateLabel: '25 октября 2026',
    category: 'Проекты',
    image: 'https://ideav.ru/blog/uploads/og/sklad-svodka.jpg',
  },
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
