import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    // Короткие версии для выдачи (#898): <title>, meta description, og/twitter и
    // JSON-LD. title и description остаются заголовком и лидом на странице —
    // длинный лид читателю полезен, а в сниппете обрезается на середине.
    // Без полей берутся title/description. Пределы держит тест issue-898.
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    // Только день ('2026-10-20') или реальное время выкладки с поясом
    // ('2026-11-07T21:37:11+03:00') — см. src/lib/dates.mjs (#905).
    pubDate: z.coerce.date(),
    // Дата последней правки — уходит в dateModified разметки BlogPosting
    // (issue #627, п. 1). Ставится руками: от даты сборки она менялась бы при
    // каждом деплое и обещала поисковику свежесть, которой не было. Если правок
    // не было, поле не нужно — dateModified равен pubDate. Только содержательные
    // правки (факты, разделы, выводы), не опечатки и не правки шаблона.
    updatedDate: z.coerce.date().optional(),
    category: z.string().default('Без категории'),
    author: z.string().default('Команда Интеграм'),
    image: z.string().optional(),
    draft: z.boolean().default(false),
    // SEO canonical override. Leave unset for posts that live on ideav.ru/blog
    // so the page is self-canonical and search engines index it. Only set this
    // when another site is genuinely the authoritative copy of the content.
    canonical: z.string().url().optional(),
    // Display-only attribution: where the post was first published (e.g. the
    // archived blog.ideav.online). Shown as "Первая публикация" in the sidebar.
    // Does NOT affect <link rel="canonical"> — see issue #331.
    originalUrl: z.string().url().optional(),
    tags: z.array(z.string()).default([]),
    // Частые вопросы (#898): выводятся блоком в конце статьи и тем же текстом
    // уходят в FAQPage разметки — разметка обязана совпадать с видимым текстом.
    faq: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
    // Тематический CTA вместо общего блока «Попробуйте Интеграм» внизу статьи
    // (issue #641): статье про дашборды кнопка «Excel → приложение» не по теме.
    // Без поля показывается общий блок.
    cta: z
      .object({
        eyebrow: z.string().default('Попробуйте Интеграм'),
        title: z.string(),
        text: z.string(),
        href: z.string().url(),
        label: z.string(),
        secondaryHref: z.string().url().optional(),
        secondaryLabel: z.string().optional(),
      })
      .optional(),
  }),
})

export const collections = { posts }
