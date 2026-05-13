import { getCollection, type CollectionEntry } from 'astro:content'

// Cyrillic → Latin map for tag slugs (matches WP's slug scheme).
// "Лайфхаки" → "laifhaki", "Яндекс.Директ" → "yandeks-direkt", etc.
const CYR_MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e',
  ж: 'zh', з: 'z', и: 'i', й: 'i', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
  ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sh',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
}

export function tagSlug(tag: string): string {
  const lower = tag.toLowerCase()
  let out = ''
  for (const ch of lower) {
    if (CYR_MAP[ch] !== undefined) out += CYR_MAP[ch]
    else if (/[a-z0-9-]/.test(ch)) out += ch
    else out += '-'
  }
  return out.replace(/-+/g, '-').replace(/^-|-$/g, '')
}

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
