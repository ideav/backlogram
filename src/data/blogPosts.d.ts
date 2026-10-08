// Типы для src/data/blogPosts.mjs (plain-ESM data, общий для React и пререндера).
// Сам файл генерируется: scripts/generate-blog-posts.mjs (npm run blog-posts).

export interface BlogPost {
  /** Слаг статьи в блоге — имя md-файла без расширения. */
  slug: string
  /** Абсолютный адрес статьи на ideav.ru/blog. */
  url: string
  title: string
  description: string
  /** Дата публикации в ISO (YYYY-MM-DD) — для сортировки и <time datetime>. */
  date: string
  /** Та же дата по-русски: «17 июля 2026». */
  dateLabel: string
  category: string
  /** Абсолютный адрес обложки (или абстрактной заглушки) на ideav.ru/blog. */
  image: string
}

export const BLOG_URL: string
/** День сборки (YYYY-MM-DD по Москве), на который собран список. */
export const BLOG_POSTS_AS_OF: string
export const SLIDER_LIMIT: number
/** Вышедшие к сборке статьи и все отложенные — см. visibleBlogPosts. */
export const BLOG_POSTS: BlogPost[]
/** Статьи, вышедшие к дню `today` (по умолчанию — сегодня по Москве). */
export function visibleBlogPosts(today?: string): BlogPost[]
