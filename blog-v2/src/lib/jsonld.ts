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

/** Организация-издатель. Совпадает с `${SITE}/#organization` основного сайта. */
function organization(site: string) {
  return {
    '@type': 'Organization',
    '@id': `${site}/#organization`,
    name: 'Интеграм',
    url: `${site}/`,
    logo: {
      '@type': 'ImageObject',
      url: `${site}/logo.png`,
    },
  }
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
  /** Абсолютный адрес обложки. */
  image?: string
  section?: string
  keywords?: string[]
  /** Слов в тексте статьи — Google показывает его в отчётах по статьям. */
  wordCount?: number
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
    image,
    section,
    keywords,
    wordCount,
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
        author: { '@type': 'Person', name: author },
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
        ...(section ? [{ name: section, url: `${blogUrl}` }] : []),
        { name: headline, url },
      ]),
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
