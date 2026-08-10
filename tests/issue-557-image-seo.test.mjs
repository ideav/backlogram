// issue #557 — SEO и доступность изображений главной страницы.
//
// Суть задачи оказалась не в отсутствующих alt (их проставили в #495), а в том,
// что главная — SPA: картинки рисует React, а поиск по изображениям видит
// только статический снапшот из scripts/prerender-landing.mjs, где их не было
// вообще. Тесты закрепляют три вещи:
//   • у каждой картинки главной есть осмысленный alt (или явный alt="" у фона);
//   • снапшот отдаёт те же скриншоты с теми же подписями, что и React;
//   • копии логотипов в бесконечной ленте не дублируют подпись.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, cpSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { HOME_CASE_SCREENSHOTS } from '../src/data/home-cases.mjs'

const repo = new URL('..', import.meta.url).pathname
const homeSource = readFileSync(resolve(repo, 'src/pages/Home.tsx'), 'utf8')
const logosSource = readFileSync(resolve(repo, 'src/components/ClientLogos.tsx'), 'utf8')
const indexHtml = readFileSync(resolve(repo, 'index.html'), 'utf8')

const SHOTS = Object.values(HOME_CASE_SCREENSHOTS)

test('every <img> on the home page carries an alt attribute', () => {
  for (const [file, source] of [['Home.tsx', homeSource], ['ClientLogos.tsx', logosSource]]) {
    const tags = source.match(/<img[\s\S]*?\/>/g) ?? []
    assert.ok(tags.length > 0, `${file}: expected to find <img> tags`)
    for (const tag of tags) {
      assert.match(tag, /\salt[=]/, `${file}: <img> without alt:\n${tag}`)
    }
  }
})

test('the decorative hero background stays hidden from assistive tech', () => {
  // Фон — не контент: пустой alt плюс aria-hidden. Осмысленная подпись здесь
  // была бы шумом для скринридера и переспамом для поиска.
  const hero = homeSource.match(/<img[^>]*hero-ai-background[\s\S]*?\/>/)
  assert.ok(hero, 'hero background <img> not found')
  assert.match(hero[0], /alt=""/)
  assert.match(hero[0], /aria-hidden="true"/)
})

test('case screenshots come from the shared source with real dimensions', () => {
  for (const key of Object.keys(HOME_CASE_SCREENSHOTS)) {
    assert.match(
      homeSource,
      new RegExp(`alt=\\{HOME_CASE_SCREENSHOTS\\.${key}\\.alt\\}`),
      `Home.tsx must take the ${key} alt from src/data/home-cases.mjs`,
    )
    assert.match(homeSource, new RegExp(`width=\\{HOME_CASE_SCREENSHOTS\\.${key}\\.width\\}`))
    assert.match(homeSource, new RegExp(`height=\\{HOME_CASE_SCREENSHOTS\\.${key}\\.height\\}`))
  }
  for (const shot of SHOTS) {
    assert.ok(shot.alt.length > 40, `alt for ${shot.file} is too thin to describe the screenshot`)
    assert.ok(shot.width > 0 && shot.height > 0, `${shot.file}: dimensions must be real pixels`)
  }
})

test('duplicated logo copies in the infinite strip are not announced twice', () => {
  // Лента показывает три копии списка ради бесшовной прокрутки. Подпись несёт
  // только первая — иначе 14 клиентов превращаются в 42 повтора.
  assert.match(logosSource, /const isDuplicate = i >= CLIENTS\.length/)
  assert.match(logosSource, /alt=\{isDuplicate \? '' : `\$\{client\.name\} — клиент платформы Интеграм`\}/)
  assert.match(logosSource, /aria-hidden=\{isDuplicate \|\| undefined\}/)
  assert.match(logosSource, /loading="lazy"/, 'off-screen logos must not block the first paint')
})

test('prerendered snapshot ships the case screenshots crawlers cannot get from React', () => {
  const work = mkdtempSync(resolve(tmpdir(), 'lp-images-'))
  mkdirSync(resolve(work, 'dist'), { recursive: true })
  mkdirSync(resolve(work, 'scripts'), { recursive: true })
  cpSync(resolve(repo, 'scripts/prerender-landing.mjs'), resolve(work, 'scripts/prerender-landing.mjs'))
  cpSync(resolve(repo, 'src/data'), resolve(work, 'src/data'), { recursive: true })
  writeFileSync(resolve(work, 'dist/index.html'), indexHtml)

  execFileSync('node', ['scripts/prerender-landing.mjs'], { cwd: work })
  const out = readFileSync(resolve(work, 'dist/index.html'), 'utf8')

  for (const shot of SHOTS) {
    const tag = out.match(new RegExp(`<img src="/${shot.file}"[^>]*>`))
    assert.ok(tag, `snapshot must contain <img> for ${shot.file}`)
    // Подпись в снапшоте — та же, что видит человек в React.
    assert.ok(
      tag[0].includes(`alt="${shot.alt.replace(/"/g, '&quot;')}"`),
      `snapshot alt for ${shot.file} must match src/data/home-cases.mjs`,
    )
    assert.ok(tag[0].includes(`width="${shot.width}"`), `${shot.file}: width attribute missing`)
    assert.ok(tag[0].includes(`height="${shot.height}"`), `${shot.file}: height attribute missing`)
    // Снапшот заменяется React'ом сразу после загрузки: без lazy живой
    // посетитель качал бы эти PNG зря, конкурируя с LCP.
    assert.ok(tag[0].includes('loading="lazy"'), `${shot.file}: must be lazy in the snapshot`)
    assert.ok(out.includes(shot.caption), `snapshot must carry the caption for ${shot.file}`)
  }
})

test('SoftwareApplication marks up all three screenshots as ImageObject', () => {
  const work = mkdtempSync(resolve(tmpdir(), 'lp-images-ld-'))
  mkdirSync(resolve(work, 'dist'), { recursive: true })
  mkdirSync(resolve(work, 'scripts'), { recursive: true })
  cpSync(resolve(repo, 'scripts/prerender-landing.mjs'), resolve(work, 'scripts/prerender-landing.mjs'))
  cpSync(resolve(repo, 'src/data'), resolve(work, 'src/data'), { recursive: true })
  writeFileSync(resolve(work, 'dist/index.html'), indexHtml)

  execFileSync('node', ['scripts/prerender-landing.mjs'], { cwd: work })
  const out = readFileSync(resolve(work, 'dist/index.html'), 'utf8')
  const ld = JSON.parse(
    out.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1].replace(/\\u003c/g, '<'),
  )
  const app = ld['@graph'].find((n) => n['@type'] === 'SoftwareApplication')
  assert.equal(app.screenshot.length, SHOTS.length)
  for (const [i, shot] of SHOTS.entries()) {
    assert.equal(app.screenshot[i]['@type'], 'ImageObject')
    assert.equal(app.screenshot[i].contentUrl, `https://ideav.ru/${shot.file}`)
    assert.equal(app.screenshot[i].caption, shot.caption)
    assert.equal(app.screenshot[i].width, shot.width)
  }
})
