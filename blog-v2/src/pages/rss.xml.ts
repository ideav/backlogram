import rss from '@astrojs/rss'
import { getCollection } from 'astro:content'
import type { APIContext } from 'astro'

export async function GET(context: APIContext) {
  const posts = await getCollection('posts', ({ data }) => !data.draft)
  const sorted = posts.sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  )

  return rss({
    title: 'Блог Интеграм',
    description:
      'No-code конструктор баз данных и веб-приложений. Истории внедрений, технические заметки и практика.',
    site: context.site!.toString(),
    items: sorted.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      categories: [post.data.category],
      author: post.data.author,
      link: `/posts/${post.id}/`,
    })),
    customData: '<language>ru-RU</language>',
  })
}
