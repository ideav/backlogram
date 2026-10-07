/**
 * Навигация сайта — один источник для React-шапки и для статического HTML.
 *
 * Потребители:
 *   - src/components/Header.tsx        — живое меню (десктоп + бургер);
 *   - scripts/lib/static-nav.mjs       — блок ссылок в сыром HTML каждой страницы;
 *   - tests/issue-627-seo-audit.test.mjs — инварианты (нет страниц-сирот).
 *
 * Зачем: шапка рисуется React'ом, и в сыром HTML (то, что видит краулер без JS)
 * ссылок меню не было ни на одной из 51 страницы карты сайта — `uslugi.html` и
 * `kvintety-ili-tablicy.html` жили только в `sitemap.xml` (аудит 02.10.2026,
 * issue #627, п. 3). Чтобы меню попадало в HTML при сборке, его ссылки должны
 * быть данными, а не разметкой внутри компонента.
 */

/** Ссылки верхнего уровня (видимы сразу, без раскрытия). */
export const headerNavLinks = [
  { name: 'Технология', href: '/#technology' },
  { name: 'Как работаем', href: '/#process' },
  { name: 'Примеры', href: '/#cases' },
  // #578: пункт ведёт на каталог услуг с ценами, а не на якорь главной —
  // Яндексу нужна отдельная страница услуг, чтобы считать сайт «сайтом услуг».
  { name: 'Услуги и цены', href: '/uslugi.html' },
  { name: 'Больше CRM', href: '/sravnenie-s-bitrix-amocrm.html' },
  { name: 'База знаний', href: '/knowledge-base.html' },
  { name: 'Блог', href: 'https://ideav.ru/blog/', external: true },
]

/** «Ещё...» — раскрывающийся список: сюда складываем новое и интересное. */
export const headerMoreLinks = [
  { name: 'Информационная система', href: '/informatsionnaya-sistema.html' },
  { name: 'Платформы с ИИ-агентами', href: '/agent-platforms.html' },
  { name: 'Решения вместо Excel', href: '/resheniya.html' },
  { name: 'Конструктор вместо Excel', href: '/konstruktor-prilozhenij.html' },
  { name: 'Excel → приложение', href: '/excel-to-app.html' },
  { name: 'Сопоставление каталогов', href: '/catalog-matching.html' },
  {
    name: 'Предпосылки no-code конструктора',
    href: 'https://ideav.ru/blog/posts/predposylki-no-code-konstruktora-integram/',
    external: true,
  },
  // Свежий пункт держим последним и помечаем «New»: список «Ещё» читают
  // сверху вниз, и новое заметнее в конце, чем в середине (issue #605).
  { name: 'Квинтеты или таблицы', href: '/kvintety-ili-tablicy.html' },
  // #642: хаб кластера «автоматизация бизнеса с ИИ».
  { name: 'Автоматизация бизнеса с ИИ', href: '/avtomatizaciya-biznesa-s-ii.html', badge: 'New' },
]

/**
 * Ссылки подвала по группам — один источник для src/components/Footer.tsx и для
 * статического блока. `icon: 'external'` — та самая иконка «ссылка наружу»,
 * которая стоит в подвале у двух пунктов; у остальных внешних её нет
 * исторически, и ставить её всем — не задача этого issue.
 */
export const footerNavGroups = [
  {
    title: 'Продукт',
    links: [
      { name: 'Технология', href: '/#technology' },
      { name: 'Схема работы', href: '/#process' },
      { name: 'Примеры', href: '/#cases' },
      { name: 'Стоимость', href: '/#pricing' },
      // #578: каталог услуг с ценами — сигнал «сайта услуг» для Яндекса.
      { name: 'Услуги и цены', href: '/uslugi.html' },
    ],
  },
  {
    title: 'Ресурсы',
    links: [
      { name: 'Документация', href: 'https://help.integram.io/', external: true, icon: 'external' },
      { name: 'База знаний', href: '/knowledge-base.html' },
      { name: 'Решения вместо Excel', href: '/resheniya.html' },
      { name: 'Конструктор вместо Excel', href: '/konstruktor-prilozhenij.html' },
      { name: 'Интеграм vs Битрикс24 / AmoCRM', href: '/sravnenie-s-bitrix-amocrm.html' },
      { name: 'Интеграции', href: 'https://integram.io/api.html', external: true },
      { name: 'Токены', href: '/tokens.html' },
      // #642: хаб кластера «автоматизация бизнеса с ИИ».
      { name: 'Автоматизация бизнеса с ИИ', href: '/avtomatizaciya-biznesa-s-ii.html' },
      // #605: опросник по архитектуре хранения — приложение к меморандуму.
      { name: 'Квинтеты или таблицы', href: '/kvintety-ili-tablicy.html' },
      // Соглашение живёт на ideav.ru: раньше пункт уводил на чужой домен integram.io.
      { name: 'Правила использования', href: '/terms.html' },
      // Политика по 152-ФЗ должна быть общедоступна с любой страницы (issue #542).
      { name: 'Обработка персональных данных', href: '/privacy.html' },
      { name: 'RUTUBE', href: 'https://rutube.ru/channel/41204904/videos/', external: true },
      { name: 'Блог', href: 'https://ideav.ru/blog/', external: true, icon: 'external' },
    ],
  },
]

/**
 * Страницы карты сайта, на которые из меню и подвала ссылок нет: отраслевые
 * лендинги (их собирает хаб /resheniya.html), страница автора и каталог
 * сценариев движения ТМЦ. Нужны в статическом блоке, чтобы у краулера без JS
 * был путь к каждому URL из `sitemap.xml`, а не только к половине.
 */
export const staticExtraLinks = [
  { name: 'База заявок', href: '/baza-zayavok.html' },
  { name: 'Управление проектами', href: '/upravlenie-proektami.html' },
  { name: 'Планирование производства', href: '/planirovanie-proizvodstva.html' },
  { name: 'Складской учёт', href: '/skladskoy-uchet.html' },
  { name: 'Управление закупками', href: '/upravlenie-zakupkami.html' },
  { name: 'Финансовый учёт', href: '/finansovyy-uchet.html' },
  { name: 'Кадровый учёт', href: '/kadrovyy-uchet.html' },
  { name: 'CRM: учёт клиентов', href: '/crm-uchet-klientov.html' },
  { name: 'Учёт договоров', href: '/uchet-dogovorov.html' },
  { name: 'Управленческий учёт', href: '/upravlencheskiy-uchet.html' },
  { name: 'Движение ТМЦ и ДС', href: '/dvizhenie-tmc-i-ds.html' },
  { name: 'Алексей Семёнов', href: '/alexey-semenov.html' },
  // #642: страницы кластера «ИИ для бизнеса» (хаб — в меню «Ещё» и в подвале).
  { name: 'ИИ-агенты для бизнеса', href: '/ii-agenty-dlya-biznesa.html' },
  { name: 'Внедрение ИИ в бизнес', href: '/vnedrenie-ii-v-biznes.html' },
  { name: 'ИИ в 1С, Битрикс24 и amoCRM', href: '/ii-v-1c-bitrix24-amocrm.html' },
  { name: 'Локальный ИИ для бизнеса', href: '/lokalnyj-ii-dlya-biznesa.html' },
  { name: 'ИИ для интеграторов', href: '/ii-dlya-integratorov.html' },
]

/** Все внутренние ссылки статического блока, без внешних и без дублей. */
export function staticNavLinks() {
  const all = [
    ...headerNavLinks,
    ...headerMoreLinks,
    ...footerNavGroups.flatMap((g) => g.links),
    ...staticExtraLinks,
  ]
  const seen = new Set()
  const out = []
  for (const link of all) {
    if (link.external) continue
    const href = link.href
    if (seen.has(href)) continue
    seen.add(href)
    out.push({ name: link.name, href })
  }
  return out
}
