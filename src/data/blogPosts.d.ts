// Типы для src/data/blogPosts.mjs (plain-ESM data, общий для React и пререндера).
// Сам файл генерируется: scripts/generate-blog-posts.mjs (npm run blog-posts).

export interface BlogPost {
  /** Слаг статьи в блоге — имя md-файла без расширения. */
  slug: string
  /** Абсолютный адрес статьи на blog.ideav.ru. */
  url: string
  title: string
  description: string
  /** Дата публикации в ISO (YYYY-MM-DD) — для сортировки и <time datetime>. */
  date: string
  /** Та же дата по-русски: «17 июля 2026». */
  dateLabel: string
  category: string
  /** Абсолютный адрес обложки (или абстрактной заглушки) на blog.ideav.ru. */
  image: string
}

export const BLOG_URL: string
export const BLOG_POSTS: BlogPost[]
