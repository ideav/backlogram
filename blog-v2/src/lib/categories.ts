import { getCollection, type CollectionEntry } from 'astro:content'
import { tagSlug } from './tags'

export interface CategoryInfo {
  name: string
  slug: string
  count: number
}

export async function getAllCategories(): Promise<CategoryInfo[]> {
  const posts = await getCollection('posts', ({ data }) => !data.draft)
  const counts = new Map<string, number>()
  for (const post of posts) {
    const c = post.data.category
    counts.set(c, (counts.get(c) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, slug: tagSlug(name), count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ru'))
}

export async function getPostsByCategorySlug(
  slug: string
): Promise<CollectionEntry<'posts'>[]> {
  const posts = await getCollection('posts', ({ data }) => !data.draft)
  return posts.filter((p) => tagSlug(p.data.category) === slug)
}

export const categorySlug = tagSlug
