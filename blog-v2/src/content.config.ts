import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    category: z.string().default('Без категории'),
    author: z.string().default('Команда Интеграм'),
    image: z.string().optional(),
    draft: z.boolean().default(false),
    // SEO canonical override. Leave unset for posts that live on blog.ideav.ru
    // so the page is self-canonical and search engines index it. Only set this
    // when another site is genuinely the authoritative copy of the content.
    canonical: z.string().url().optional(),
    // Display-only attribution: where the post was first published (e.g. the
    // archived blog.ideav.online). Shown as "Первая публикация" in the sidebar.
    // Does NOT affect <link rel="canonical"> — see issue #331.
    originalUrl: z.string().url().optional(),
    tags: z.array(z.string()).default([]),
  }),
})

export const collections = { posts }
