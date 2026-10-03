import { getCollection, type CollectionEntry } from 'astro:content'

// Слаг тега и порог «тонкого» тега живут в tag-slug.mjs: их же импортирует
// astro.config.mjs для фильтра карты сайта, где astro:content недоступен.
export { tagSlug, isThinTag, THIN_TAG_MIN_POSTS } from './tag-slug.mjs'
import { tagSlug } from './tag-slug.mjs'

export interface TagInfo {
  tag: string
  slug: string
  count: number
  /** 0..1 — relative weight (1 = most-used tag, 0 = least-used) */
  weight: number
}

export async function getAllTags(): Promise<TagInfo[]> {
  const posts = await getCollection('posts', ({ data }) => !data.draft)
  const counts = new Map<string, number>()
  for (const post of posts) {
    for (const tag of post.data.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }
  if (counts.size === 0) return []
  const values = [...counts.values()]
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = Math.max(1, max - min)
  return [...counts.entries()]
    .map(([tag, count]) => ({
      tag,
      slug: tagSlug(tag),
      count,
      weight: (count - min) / span,
    }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'ru'))
}

export async function getPostsByTagSlug(
  slug: string
): Promise<CollectionEntry<'posts'>[]> {
  const posts = await getCollection('posts', ({ data }) => !data.draft)
  return posts.filter((post) =>
    (post.data.tags ?? []).some((t) => tagSlug(t) === slug)
  )
}
