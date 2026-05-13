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
    canonical: z.string().url().optional(),
    tags: z.array(z.string()).default([]),
  }),
})

export const collections = { posts }
