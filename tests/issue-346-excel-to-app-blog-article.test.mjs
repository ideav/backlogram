import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

const postsDir = new URL('../blog-v2/src/content/posts/', import.meta.url)
const postFile = 'excel-v-prilozhenie-za-45-minut-kak-rabotaet-ii-agent-integrama.md'
const postPath = new URL(postFile, postsDir)

function frontmatterValue(source, field) {
  const match = source.match(new RegExp(`^${field}:\\s*['"]?(.*?)['"]?$`, 'm'))
  return match?.[1]
}

test('blog publishes the Excel to app AI-agent article requested in issue 346', () => {
  assert.ok(existsSync(postPath), `expected ${postFile} to exist`)

  const post = readFileSync(postPath, 'utf8')

  assert.match(post, /title:\s*['"]Excel в приложение за 45 минут: чем отличается подход Интеграма['"]/)
  assert.match(post, /pubDate:\s*['"]?2026-06-12['"]?/)
  assert.match(post, /category:\s*['"]?О платформе['"]?/)
  assert.match(post, /author:\s*['"]?Команда Интеграм['"]?/)
  assert.doesNotMatch(post, /^draft:\s*true/m)
  assert.doesNotMatch(post, /^canonical:/m, 'new article should use the new blog canonical URL')

  assert.match(post, /\[странице «Excel → приложение»\]\(https:\/\/ideav\.ru\/excel-to-app\.html\)/)
  assert.match(post, /примерно за 45 минут/)
  assert.match(post, /12 500 ₽/)
  assert.match(post, /Тематика приложения/)
  assert.match(post, /существующие файлы клиента/)
  assert.match(post, /сайт клиента/)

  assert.match(post, /разбирает реальные Excel-файлы/)
  assert.match(post, /повторяющиеся колонки/)
  assert.match(post, /один-ко-многим/)
  assert.match(post, /ссылка или подчинённая таблица/)
  assert.match(post, /роль × данные × интерфейс/)

  assert.match(post, /## Короткий ответ/)
  assert.match(post, /## Что на самом деле делает агент/)
  assert.match(post, /## Чем это отличается от соседних подходов/)
  assert.match(post, /## Где заканчивается автоматизация/)
  assert.match(post, /## Как корректно говорить про «аналогов нет»/)
  assert.match(post, /## Практический вывод/)

  assert.match(post, /\| Подход \| Что получает заказчик \| Главный компромисс \|/)
  assert.match(post, /не нужно формулировать как «в мире нет ничего похожего»/)
})

test('Excel to app AI-agent article is issue 65 in the chronological blog archive', () => {
  assert.ok(existsSync(postPath), `expected ${postFile} to exist`)

  const posts = readdirSync(postsDir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const source = readFileSync(new URL(file, postsDir), 'utf8')
      return {
        file,
        pubDate: frontmatterValue(source, 'pubDate'),
        draft: frontmatterValue(source, 'draft') === 'true',
      }
    })
    .filter((post) => !post.draft)
    .sort((a, b) => a.pubDate.localeCompare(b.pubDate) || a.file.localeCompare(b.file))

  assert.equal(posts.findIndex((post) => post.file === postFile) + 1, 65)
})
