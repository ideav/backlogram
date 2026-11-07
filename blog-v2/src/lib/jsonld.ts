/**
 * Разметка Schema.org для блога (issue #627, п. 1).
 *
 * До этой правки ни одна страница блога не отдавала JSON-LD: ни BlogPosting у
 * статей, ни хлебных крошек, ни CollectionPage у разделов и тегов. Поисковик
 * видел обычную HTML-страницу без даты, автора и издателя — а на основном сайте
 * (ideav.ru) такая разметка есть у каждой страницы.
 *
 * Все узлы собираются в один `@graph`: ссылки по `@id` разрешаются только внутри
 * одной страницы, поэтому Organization не выносится «куда-то наружу», а
 * вкладывается в граф каждой страницы (тот же вывод, что в пререндерах сайта).
 *
 * Отдаёт готовый объект; подставляет его BaseLayout через проп `jsonLd`.
 */

/**
 * Организация-издатель. Тот же узел `${SITE}/#organization`, что в пререндере
 * главной (scripts/prerender-landing.mjs): одинаковый @id с разными полями
 * дробит бренд на две сущности. Раньше здесь были только name/url/logo — без
 * description и sameAs модели не связывали «Интеграм», ideav.ru и integram.io
 * (аудит SEO/GEO, issue #898).
 */
function organization(site: string) {
  return {
    '@type': 'Organization',
    '@id': `${site}/#organization`,
    name: 'Интеграм',
    legalName: 'АО «Интеграм»',
    alternateName: ['Конструктор Интеграм', 'Integram'],
    description:
      'Интеграм — российский no-code конструктор приложений и баз данных (не социальная сеть). Из Excel — рабочее веб-приложение с формами, правами доступа и отчётами.',
    url: `${site}/`,
    logo: {
      '@type': 'ImageObject',
      url: `${site}/logos/integram-og.png`,
    },
    sameAs: [
      'https://integram.io',
      'https://reestr.digital.gov.ru/reestr/4638631/',
      'https://rutube.ru/channel/41204904/videos/',
    ],
  }
}

/** Живой автор с профилем в блоге (#905). */
export interface AuthorProfile {
  /** Абсолютный адрес профиля. */
  url: string
  jobTitle: string
}

/** Узел Person автора с профилем: один @id на постах и на странице профиля. */
export function personNode(site: string, name: string, profile: AuthorProfile) {
  return {
    '@type': 'Person',
    '@id': `${profile.url}#person`,
    name,
    jobTitle: profile.jobTitle,
    url: profile.url,
    worksFor: { '@id': `${site}/#organization` },
  }
}

/**
 * Автор статьи. «Команда Интеграм» — не человек, и `Person` с таким именем
 * поисковик считает ошибкой разметки (#898): коллективный автор ссылается на
 * организацию-издателя. Человек с профилем (#905) — полный Person со ссылкой
 * на профиль; прочие имена — Person с одним именем.
 */
export function authorNode(site: string, author: string, profile?: AuthorProfile) {
  if (profile) return personNode(site, author, profile)
  // Не \b: в JS он видит границу слова только у латиницы.
  return /^(команда|редакция)(\s|$)/i.test(author.trim())
    ? { '@id': `${site}/#organization` }
    : { '@type': 'Person', name: author }
}

function breadcrumb(id: string, items: Array<{ name: string; url: string }>) {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${id}#breadcrumb`,
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  }
}

export interface PostGraphInput {
  /** Абсолютный адрес сайта без хвостового слэша: 'https://ideav.ru'. */
  site: string
  /** Абсолютный канонический адрес статьи. */
  url: string
  /** Абсолютный адрес главной блога. */
  blogUrl: string
  headline: string
  description: string
  /** ISO-дата публикации. */
  datePublished: string
  /** ISO-дата правки; если правок не было — равна датe публикации. */
  dateModified: string
  author: string
  /** Профиль автора-человека (#905). */
  authorProfile?: AuthorProfile
  /** Абсолютный адрес обложки. */
  image?: string
  section?: string
  /** Абсолютный адрес страницы раздела — третья крошка цепочки. */
  sectionUrl?: string
  keywords?: string[]
  /** Слов в тексте статьи — Google показывает его в отчётах по статьям. */
  wordCount?: number
  /** Частые вопросы статьи — узел FAQPage (#898). */
  faq?: Array<{ q: string; a: string }>
}

/** BlogPosting + Organization + BreadcrumbList для страницы статьи. */
export function postGraph(input: PostGraphInput) {
  const {
    site,
    url,
    blogUrl,
    headline,
    description,
    datePublished,
    dateModified,
    author,
    authorProfile,
    image,
    section,
    sectionUrl,
    keywords,
    wordCount,
    faq,
  } = input

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        '@id': `${url}#article`,
        headline,
        description,
        inLanguage: 'ru',
        url,
        mainEntityOfPage: url,
        datePublished,
        dateModified,
        author: authorNode(site, author, authorProfile),
        publisher: { '@id': `${site}/#organization` },
        ...(image ? { image } : {}),
        ...(section ? { articleSection: section } : {}),
        ...(keywords?.length ? { keywords: keywords.join(', ') } : {}),
        ...(wordCount ? { wordCount } : {}),
        isPartOf: { '@id': `${blogUrl}#blog` },
      },
      {
        '@type': 'Blog',
        '@id': `${blogUrl}#blog`,
        name: 'Блог Интеграм',
        url: blogUrl,
        inLanguage: 'ru',
        publisher: { '@id': `${site}/#organization` },
      },
      organization(site),
      breadcrumb(url, [
        { name: 'Интеграм', url: `${site}/` },
        { name: 'Блог', url: blogUrl },
        // Раньше крошка раздела вела на главную блога — два пункта цепочки с одним
        // URL (#898). Без адреса раздела крошку не выдумываем.
        ...(section && sectionUrl ? [{ name: section, url: sectionUrl }] : []),
        { name: headline, url },
      ]),
      ...(faq?.length
        ? [
            {
              '@type': 'FAQPage',
              '@id': `${url}#faq`,
              isPartOf: { '@id': `${url}#article` },
              mainEntity: faq.map((it) => ({
                '@type': 'Question',
                name: it.q,
                acceptedAnswer: { '@type': 'Answer', text: it.a },
              })),
            },
          ]
        : []),
    ],
  }
}

export interface CollectionGraphInput {
  site: string
  url: string
  blogUrl: string
  name: string
  description: string
  /** Хлебные крошки после «Блог»: раздел, тег, «Поиск». */
  trail?: Array<{ name: string; url: string }>
  /** Статьи списка в порядке вывода — попадают в ItemList. */
  items?: Array<{ name: string; url: string }>
}

/** CollectionPage + ItemList + Organization + BreadcrumbList для списков. */
export function collectionGraph(input: CollectionGraphInput) {
  const { site, url, blogUrl, name, description, trail = [], items = [] } = input

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${url}#webpage`,
        url,
        name,
        description,
        inLanguage: 'ru',
        isPartOf: { '@id': `${blogUrl}#blog` },
        ...(items.length
          ? {
              mainEntity: {
                '@type': 'ItemList',
                numberOfItems: items.length,
                itemListElement: items.map((it, i) => ({
                  '@type': 'ListItem',
                  position: i + 1,
                  name: it.name,
                  url: it.url,
                })),
              },
            }
          : {}),
      },
      {
        '@type': 'Blog',
        '@id': `${blogUrl}#blog`,
        name: 'Блог Интеграм',
        url: blogUrl,
        inLanguage: 'ru',
        publisher: { '@id': `${site}/#organization` },
      },
      organization(site),
      breadcrumb(url, [
        { name: 'Интеграм', url: `${site}/` },
        { name: 'Блог', url: blogUrl },
        ...trail,
      ]),
    ],
  }
}

export interface ProfileGraphInput {
  site: string
  blogUrl: string
  name: string
  profile: AuthorProfile
  /** Посты автора в порядке вывода. */
  items: Array<{ name: string; url: string }>
}

/** ProfilePage + Person + посты автора + Organization + крошки (#905). */
export function profileGraph(input: ProfileGraphInput) {
  const { site, blogUrl, name, profile, items } = input
  const url = profile.url
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfilePage',
        '@id': `${url}#webpage`,
        url,
        name: `${name} — автор блога Интеграм`,
        inLanguage: 'ru',
        isPartOf: { '@id': `${blogUrl}#blog` },
        mainEntity: { '@id': `${url}#person` },
        ...(items.length
          ? { hasPart: items.map((it) => ({ '@type': 'BlogPosting', headline: it.name, url: it.url })) }
          : {}),
      },
      personNode(site, name, profile),
      {
        '@type': 'Blog',
        '@id': `${blogUrl}#blog`,
        name: 'Блог Интеграм',
        url: blogUrl,
        inLanguage: 'ru',
        publisher: { '@id': `${site}/#organization` },
      },
      organization(site),
      breadcrumb(url, [
        { name: 'Интеграм', url: `${site}/` },
        { name: 'Блог', url: blogUrl },
        { name, url },
      ]),
    ],
  }
}
