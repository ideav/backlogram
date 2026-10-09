/**
 * Структурированные данные (JSON-LD) для всех страниц домена (issue #626).
 *
 * Разметки не было вовсе — ни `Organization`, ни `Service`, ни `FAQPage`.
 * Для Яндекса и Google это дешёвый рычаг, а ИИ-ответы из сырого HTML обычно
 * берут только то, что лежит в JSON-LD.
 *
 * Модуль читают двое: `vite.config.ts` (главная) и
 * `scripts/prerender-site-excel.mjs` (страницы кейсов и сравнения). Поэтому
 * здесь, как и в content.ts, не должно быть ни React, ни браузерных API.
 */
import {
  ADEPT,
  CASES,
  COMPARE_PAGE,
  CONTACT_EMAIL,
  FAQ,
  HOME_DATES,
  PAGES,
  PARTNER,
  PRAKTIKUM,
  PRICING_GROUPS,
  type Case,
  type Landing,
  type PageDates,
} from './content'

const ORG_NAME = 'АО «Интеграм»'
const ORG_SITE = 'https://ideav.ru/'
const SERVICE_NAME = 'Приложение из Excel-таблицы за 45 минут'

/**
 * Профили той же организации в других местах (issue #738): по `sameAs` ИИ и
 * поисковик склеивают «Интеграм» с excel-to-app.ru, ideav.ru и реестровой
 * записью в одну сущность. Список — тот же, что у ideav.ru
 * (scripts/prerender-landing.mjs), плюс сам ideav.ru.
 */
const ORG_SAME_AS = [
  'https://ideav.ru/',
  'https://integram.io',
  'https://reestr.digital.gov.ru/reestr/4638631/',
  'https://rutube.ru/channel/41204904/videos/',
  'https://ideav.ru/blog/',
]

/** `https://excel-to-app.ru/` → `https://excel-to-app.ru`. */
function origin(canonical: string): string {
  return canonical.replace(/\/+$/, '')
}

function organizationId(canonical: string): string {
  return `${origin(canonical)}/#organization`
}

function organization(canonical: string): Record<string, unknown> {
  return {
    '@type': 'Organization',
    '@id': organizationId(canonical),
    name: ORG_NAME,
    legalName: ORG_NAME,
    // «Конструктор Интеграм» и описание — чтобы бренд не «исправляли» на «инстаграм»
    // (так же на ideav.ru, issue #387).
    alternateName: ['Интеграм', 'Integram', 'Конструктор Интеграм'],
    description:
      'Интеграм — российская платформа для бизнес-приложений и баз данных (не социальная сеть). ИИ-агент собирает из рабочих таблиц Excel веб-приложение с формами, правами доступа и отчётами.',
    url: ORG_SITE,
    sameAs: ORG_SAME_AS,
    email: CONTACT_EMAIL,
    // ИНН и ОГРН — те же, что в подвале сайта (ч. 2 ст. 18.1 152-ФЗ).
    taxID: '9716002710',
    vatID: '9716002710',
    identifier: [
      { '@type': 'PropertyValue', name: 'ИНН', value: '9716002710' },
      { '@type': 'PropertyValue', name: 'ОГРН', value: '1247700757590' },
      {
        '@type': 'PropertyValue',
        name: 'Реестр российского ПО',
        value: '30872',
      },
    ],
    logo: `${canonical}og/excel-to-app.png`,
    areaServed: 'RU',
  }
}

/**
 * Цена карточки в число. «от 93 750» → 93750 и признак «минимальная».
 * Неразрывные и обычные пробелы внутри числа — разделители разрядов.
 */
function parsePrice(raw: string): { value: number; from: boolean } {
  const from = /^от\s/i.test(raw)
  const value = Number(raw.replace(/[^\d]/g, ''))
  return { value, from }
}

function offers(canonical: string): Record<string, unknown>[] {
  const list: Record<string, unknown>[] = [
    {
      '@type': 'Offer',
      name: 'Демонстрация на ваших файлах',
      description:
        'Работающее приложение с вашими данными примерно через 45 минут после присланных таблиц.',
      price: 0,
      priceCurrency: 'RUB',
      url: canonical,
      availability: 'https://schema.org/InStock',
    },
  ]
  for (const group of PRICING_GROUPS) {
    for (const plan of group.plans) {
      const { value, from } = parsePrice(plan.price)
      if (!Number.isFinite(value) || value === 0) continue
      const unit = plan.unit ? ` ${plan.unit.replace(/^\/\s*/, 'за ')}` : ''
      list.push({
        '@type': 'Offer',
        name: plan.title,
        description: plan.sub,
        category: group.tag,
        priceCurrency: 'RUB',
        url: plan.href ?? `${canonical}#ceny`,
        availability: 'https://schema.org/InStock',
        ...(from
          ? {
              priceSpecification: {
                '@type': 'PriceSpecification',
                minPrice: value,
                priceCurrency: 'RUB',
                description: `${plan.price} ₽${unit}`.trim(),
              },
            }
          : { price: value }),
      })
    }
  }
  return list
}

function faqPage(canonical: string): Record<string, unknown> {
  return {
    '@type': 'FAQPage',
    '@id': `${canonical}#faq`,
    mainEntity: FAQ.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }
}

/** `datePublished`/`dateModified` из дат страницы (issue #738). */
function dates(page: PageDates): Record<string, string> {
  return { datePublished: page.published, dateModified: page.updated }
}

function breadcrumbs(items: { name: string; item: string }[]): Record<string, unknown> {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map(({ name, item }, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item,
    })),
  }
}

/** Главная: кто мы, что продаём, почём и ответы на частые вопросы. */
export function landingJsonLd(canonical: string): Record<string, unknown>[] {
  return [
    organization(canonical),
    {
      '@type': 'Service',
      '@id': `${canonical}#service`,
      name: SERVICE_NAME,
      serviceType: 'Разработка приложений из Excel-таблиц',
      provider: { '@id': organizationId(canonical) },
      areaServed: 'RU',
      url: canonical,
      description:
        'ИИ-агент Интеграма строит из рабочих таблиц Excel веб-приложение с формами, ролями, правами доступа, отчётами и графиками. Демонстрация на ваших данных — бесплатно, примерно за 45 минут.',
      offers: offers(canonical),
    },
    {
      '@type': 'WebPage',
      '@id': canonical,
      url: canonical,
      name: PAGES[0].title,
      description: PAGES[0].description,
      inLanguage: 'ru-RU',
      about: { '@id': `${canonical}#service` },
      publisher: { '@id': organizationId(canonical) },
      ...dates(HOME_DATES),
    },
    faqPage(canonical),
  ]
}

/**
 * Страница кейса: WebPage с крошками, `Article` с датами и автором и
 * `FAQPage` из вопросов кейса (issue #738). Кейс — готовый ответ на запрос
 * «как сделать X из Excel», и тип `Article` с датой ИИ-поиск берёт в источники
 * охотнее, чем безымянный `WebPage`.
 */
export function caseJsonLd(canonical: string, item: Case): Record<string, unknown>[] {
  const url = `${canonical}keysy/${item.slug}/`
  const images = (item.screens ?? []).map(shot => `${canonical}${shot.src}`)
  return [
    organization(canonical),
    {
      '@type': 'WebPage',
      '@id': url,
      url,
      name: item.pageTitle,
      description: item.pageDescription,
      inLanguage: 'ru-RU',
      isPartOf: { '@id': canonical },
      about: { '@id': `${canonical}#service` },
      publisher: { '@id': organizationId(canonical) },
      primaryImageOfPage: images[0],
      mainEntity: { '@id': `${url}#article` },
      ...dates(item),
      breadcrumb: breadcrumbs([
        { name: 'Excel → приложение', item: canonical },
        { name: 'Кейсы', item: `${canonical}#keysy` },
        { name: item.client, item: url },
      ]),
    },
    {
      '@type': 'Article',
      '@id': `${url}#article`,
      headline: item.pageTitle,
      description: item.pageDescription,
      url,
      inLanguage: 'ru-RU',
      mainEntityOfPage: { '@id': url },
      about: [{ '@id': `${canonical}#service` }, { '@type': 'Thing', name: item.industry }],
      author: { '@id': organizationId(canonical) },
      publisher: { '@id': organizationId(canonical) },
      image: images.length > 0 ? images : undefined,
      ...dates(item),
    },
    {
      '@type': 'FAQPage',
      '@id': `${url}#faq`,
      mainEntity: item.faq.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    },
  ]
}

/** Страница сравнения. */
export function compareJsonLd(canonical: string): Record<string, unknown>[] {
  const url = `${canonical}${COMPARE_PAGE.slug}/`
  return [
    organization(canonical),
    {
      '@type': 'WebPage',
      '@id': url,
      url,
      name: COMPARE_PAGE.pageTitle,
      description: COMPARE_PAGE.pageDescription,
      inLanguage: 'ru-RU',
      isPartOf: { '@id': canonical },
      about: { '@id': `${canonical}#service` },
      publisher: { '@id': organizationId(canonical) },
      ...dates(COMPARE_PAGE),
      mentions: CASES.map(item => ({
        '@type': 'WebPage',
        name: item.pageTitle,
        url: `${canonical}keysy/${item.slug}/`,
      })),
      breadcrumb: breadcrumbs([
        { name: 'Excel → приложение', item: canonical },
        { name: 'Сравнение платформ', item: url },
      ]),
    },
  ]
}

/**
 * Посадочная страница (issue #657): WebPage, хлебные крошки и FAQPage из
 * вопросов именно этой страницы — тех же, что видны в блоке «Вопросы и ответы».
 */
export function landingPageJsonLd(
  canonical: string,
  page: Landing,
  faq: { q: string; a: string }[],
): Record<string, unknown>[] {
  const url = `${canonical}${page.slug}/`
  return [
    organization(canonical),
    {
      '@type': 'WebPage',
      '@id': url,
      url,
      name: page.title,
      description: page.description,
      inLanguage: 'ru-RU',
      isPartOf: { '@id': canonical },
      about: { '@id': `${canonical}#service` },
      publisher: { '@id': organizationId(canonical) },
      ...dates(page),
      breadcrumb: breadcrumbs([
        { name: 'Excel → приложение', item: canonical },
        { name: page.crumb, item: url },
      ]),
    },
    {
      '@type': 'FAQPage',
      '@id': `${url}#faq`,
      mainEntity: faq.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    },
  ]
}

/**
 * Страница практикума (issue #659). Тип `Course`: у него есть
 * `coursePrerequisites` — ровно тот «порог вхождения», ради которого страница
 * и делалась, — и уровень `educationalLevel`. Дат на странице нет, поэтому
 * `hasCourseInstance` описывает только формат: онлайн, один час.
 */
export function praktikumJsonLd(canonical: string): Record<string, unknown>[] {
  const url = `${canonical}${PRAKTIKUM.slug}/`
  return [
    organization(canonical),
    {
      '@type': 'Course',
      '@id': `${url}#course`,
      name: PRAKTIKUM.title,
      description: PRAKTIKUM.pageDescription,
      url,
      inLanguage: 'ru-RU',
      educationalLevel: 'Beginner',
      coursePrerequisites: PRAKTIKUM.skills.map(s => s.title),
      teaches: PRAKTIKUM.gets,
      provider: { '@id': organizationId(canonical) },
      isAccessibleForFree: false,
      offers: {
        '@type': 'Offer',
        category: 'Paid',
        price: PRAKTIKUM.priceValue,
        priceCurrency: 'RUB',
        url,
        availability: 'https://schema.org/InStock',
      },
      hasCourseInstance: {
        '@type': 'CourseInstance',
        courseMode: 'Online',
        courseWorkload: 'PT1H',
      },
    },
    {
      '@type': 'WebPage',
      '@id': url,
      url,
      name: PRAKTIKUM.pageTitle,
      description: PRAKTIKUM.pageDescription,
      inLanguage: 'ru-RU',
      isPartOf: { '@id': canonical },
      about: { '@id': `${url}#course` },
      publisher: { '@id': organizationId(canonical) },
      ...dates(PRAKTIKUM),
      breadcrumb: breadcrumbs([
        { name: 'Excel → приложение', item: canonical },
        { name: 'Практикум', item: url },
      ]),
    },
  ]
}

/**
 * Страницы рекрутинга адептов и партнёров (issue #671): простой `WebPage`
 * с крошками. Ни `Course`, ни `JobPosting` не подходят — дат, ставок и
 * программы с часами на странице нет.
 */
export function programJsonLd(canonical: string, program: typeof ADEPT | typeof PARTNER): Record<string, unknown>[] {
  const url = `${canonical}${program.slug}/`
  return [
    organization(canonical),
    {
      '@type': 'WebPage',
      '@id': url,
      url,
      name: program.pageTitle,
      description: program.pageDescription,
      inLanguage: 'ru-RU',
      isPartOf: { '@id': canonical },
      publisher: { '@id': organizationId(canonical) },
      ...dates(program),
      breadcrumb: breadcrumbs([
        { name: 'Excel → приложение', item: canonical },
        { name: program.crumb, item: url },
      ]),
    },
  ]
}

/**
 * Готовый тег для вставки в <head>.
 *
 * `<` экранируется: иначе строка `</script>` внутри любого текста закрыла бы
 * тег раньше времени и остаток разметки уехал бы в тело страницы.
 */
export function jsonLdScript(nodes: Record<string, unknown>[]): string {
  const payload = JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes })
  return `<script type="application/ld+json">${payload.replace(/</g, '\\u003c')}</script>`
}
