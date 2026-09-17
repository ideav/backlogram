import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, cpSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import {
  QUESTIONS,
  QUIZ_META,
  CROSS,
  COMBO_SURCHARGE,
  points,
  hours,
  ceilings,
  score,
  verdict,
} from '../src/data/quintetsQuiz.mjs'

// Опросник «квинтеты / обычные таблицы / комбинация» перенесён из отдельного
// HTML-файла в репозитории продукта на ideav.ru (issue #605). Здесь стережётся
// то, что при переносе легче всего сломать молча:
//   • сходимость шкалы — веса в сумме 100, потолки 100/100/90, балл не выше
//     веса вопроса. Правка одного веса ломает её незаметно: страница всё равно
//     нарисуется, просто «100 баллов» перестанут быть достижимыми;
//   • правило перекоса — оно описано именами вопросов, и переименование id
//     обессмысливает его без единой ошибки;
//   • снапшот — страница интерактивная, но её содержание обязано читаться без JS.

// fileURLToPath, а не .pathname: на Windows .pathname даёт '/C:/…' и readFileSync
// ищет файл по 'C:C:…'.
const repo = fileURLToPath(new URL('..', import.meta.url))
const indexHtml = readFileSync(resolve(repo, 'index.html'), 'utf8')
const router = readFileSync(resolve(repo, 'src/router.tsx'), 'utf8')
const header = readFileSync(resolve(repo, 'src/components/Header.tsx'), 'utf8')
const footer = readFileSync(resolve(repo, 'src/components/Footer.tsx'), 'utf8')
const htaccess = readFileSync(resolve(repo, 'public/.htaccess'), 'utf8')
const sitemap = readFileSync(resolve(repo, 'public/sitemap.xml'), 'utf8')
const homeTitle = indexHtml.match(/<title>([\s\S]*?)<\/title>/)[1]

function makeWorkspace(prefix) {
  const work = mkdtempSync(resolve(tmpdir(), prefix))
  mkdirSync(resolve(work, 'dist'), { recursive: true })
  mkdirSync(resolve(work, 'scripts'), { recursive: true })
  cpSync(
    resolve(repo, 'scripts/prerender-kvintety-ili-tablicy.mjs'),
    resolve(work, 'scripts/prerender-kvintety-ili-tablicy.mjs'),
  )
  cpSync(resolve(repo, 'scripts/prerender-landing.mjs'), resolve(work, 'scripts/prerender-landing.mjs'))
  // Оба пререндера читают данные из src/data — без них песочница падает на
  // ERR_MODULE_NOT_FOUND.
  cpSync(resolve(repo, 'src/data'), resolve(work, 'src/data'), { recursive: true })
  writeFileSync(resolve(work, 'dist/index.html'), indexHtml)
  return work
}

test('шкала сходится: веса дают 100, потолки 100/100/90, балл не выше веса', () => {
  const w = QUESTIONS.reduce((a, q) => a + q.w, 0)
  assert.equal(w, 100, 'веса вопросов должны давать ровно 100')
  assert.deepEqual(
    ceilings(),
    [100, 100, 90],
    'потолок чистых вариантов — 100, у комбинации ниже по устройству шкалы',
  )
  for (const q of QUESTIONS) {
    for (const o of q.o) {
      for (const p of points(o, q.w)) {
        assert.ok(p <= q.w, `вопрос «${q.t}»: балл ${p} выше веса ${q.w}`)
      }
    }
  }
})

test('у каждого ответа заданы и баллы, и часы обоих чистых вариантов', () => {
  assert.equal(QUESTIONS.length, 13)
  for (const q of QUESTIONS) {
    assert.ok(q.id, 'у вопроса должен быть id — по нему описан перекос')
    for (const o of q.o) {
      assert.equal(o[1].length, 2, `вопрос «${q.t}»: баллы задаются парой`)
      assert.equal(o[2].length, 2, `вопрос «${q.t}»: часы задаются парой`)
      // null допустим только в часах и означает «так не делается».
      assert.ok(o[1].every((p) => typeof p === 'number'), 'баллы — числа')
      assert.ok(o[2].every((h) => h === null || typeof h === 'number'), 'часы — числа либо null')
    }
  }
  // Уникальность id: перекос адресуется именами, дубль увёл бы правило не туда.
  const ids = QUESTIONS.map((q) => q.id)
  assert.equal(new Set(ids).size, ids.length, 'id вопросов должны быть уникальны')
})

test('правило перекоса адресует существующие вопросы и ответы', () => {
  assert.ok(CROSS.length > 0, 'перекос — часть модели, а не украшение')
  for (const c of CROSS) {
    for (const [id, oi] of Object.entries(c.when)) {
      const q = QUESTIONS.find((x) => x.id === id)
      assert.ok(q, `перекос ссылается на несуществующий вопрос «${id}»`)
      assert.ok(q.o[oi], `перекос ссылается на несуществующий ответ ${oi} вопроса «${id}»`)
    }
    assert.equal(c.add.length, 3, 'надбавка задаётся по одному числу на вариант')
  }
})

test('перекос дорожает только парой ответов и только у РСУБД', () => {
  const pick = (overrides) => QUESTIONS.map((q, i) => (i in overrides ? overrides[i] : 0))
  const iWho = QUESTIONS.findIndex((q) => q.id === 'who')
  const iQry = QUESTIONS.findIndex((q) => q.id === 'qry')

  const neither = score(pick({}))
  const onlyWho = score(pick({ [iWho]: 1 }))
  const onlyQry = score(pick({ [iQry]: 2 }))
  const both = score(pick({ [iWho]: 1, [iQry]: 2 }))

  assert.equal(neither.cross.length, 0)
  assert.equal(onlyWho.cross.length, 0, 'один ответ перекоса не включает')
  assert.equal(onlyQry.cross.length, 0, 'один ответ перекоса не включает')
  assert.equal(both.cross.length, 1, 'пара ответов включает перекос')

  // Часы по вопросам складываются, поэтому надбавка видна как остаток сверх суммы
  // двух изменений: она идёт целиком РСУБД и равна 160 часам.
  const rowsOnly = onlyWho.hours[1] + onlyQry.hours[1] - neither.hours[1]
  assert.equal(both.hours[1] - rowsOnly, 160, 'перекос обязан добавлять ровно 160 часов РСУБД')
  assert.equal(
    both.hours[0],
    onlyWho.hours[0] + onlyQry.hours[0] - neither.hours[0],
    'часы квинтетов перекос не меняет',
  )
  assert.equal(
    both.hours[2],
    onlyWho.hours[2] + onlyQry.hours[2] - neither.hours[2],
    'часы комбинации перекос не меняет',
  )
  assert.deepEqual(
    both.sum,
    [0, 1, 2].map((i) => onlyWho.sum[i] + onlyQry.sum[i] - neither.sum[i]),
    'перекос не трогает баллы',
  )
})

test('нулевой балл — блокер, «так не делается» тоже', () => {
  const iGeo = QUESTIONS.findIndex((q) => q.id === 'geo')
  const answers = QUESTIONS.map((q, i) => (i === iGeo ? q.o.length - 1 : 0))
  const v = verdict(answers)
  assert.ok(v.complete, 'отвечены все вопросы')
  assert.ok(v.blocked[0].includes(iGeo + 1), 'полигоны блокируют чистые квинтеты')
  assert.equal(v.blocked[2].length, 0, 'комбинация блокер не наследует')
  assert.notEqual(v.best, 0, 'заблокированный вариант не может победить')
  assert.equal(hours(QUESTIONS[iGeo].o[QUESTIONS[iGeo].o.length - 1])[0], null)
})

test('комбинация платит надбавку за стык только на полном наборе ответов', () => {
  const partial = score(QUESTIONS.map((_, i) => (i === 0 ? 0 : null)))
  const full = score(QUESTIONS.map(() => 0))
  // Часы самих строк при этих ответах — надбавка считается сверх них.
  const rows = QUESTIONS.reduce((a, q) => a + hours(q.o[0])[2], 0)
  assert.equal(partial.complete, false)
  assert.equal(partial.hours[2], hours(QUESTIONS[0].o[0])[2], 'на неполном наборе надбавки ещё нет')
  assert.equal(full.hours[2] - rows, COMBO_SURCHARGE, 'на полном — 128 часов за стык двух хранилищ')
  assert.equal(COMBO_SURCHARGE, 128)
})

test('SPA знает оба маршрута опросника', () => {
  assert.match(router, /path: 'kvintety-ili-tablicy\.html'/)
  assert.match(router, /path: 'kvintety-ili-tablicy'/)
  assert.match(router, /import\('\.\/pages\/KvintetyIliTablicy'\)/)
})

test('страница доступна из шапки, подвала, sitemap и по адресу без расширения', () => {
  assert.match(header, /href: '\/kvintety-ili-tablicy\.html'/)
  assert.match(footer, /to="\/kvintety-ili-tablicy\.html"/)
  assert.match(sitemap, /<loc>https:\/\/ideav\.ru\/kvintety-ili-tablicy\.html<\/loc>/)
  assert.match(htaccess, /RewriteRule \^kvintety-ili-tablicy\/\?\$ \/kvintety-ili-tablicy\.html \[R=301,L\]/)
  // Редирект обязан стоять выше front controller — иначе путь уйдёт в движок.
  // Комментарии снимаются: строка `RewriteRule ^ index.php` встречается и в
  // шапке файла, в прозе, — по ней порядок правил не судят.
  const rules = htaccess
    .split('\n')
    .filter((line) => !line.trim().startsWith('#'))
    .join('\n')
  assert.ok(
    rules.indexOf('kvintety-ili-tablicy') < rules.indexOf('RewriteRule ^ index.php'),
    'правило должно стоять до front controller',
  )
})

test('колонке «Итог» ничто не мешает прилипать', () => {
  const page = readFileSync(resolve(repo, 'src/pages/KvintetyIliTablicy.tsx'), 'utf8')
  assert.match(page, /lg:sticky lg:top-24/)
  // `overflow: hidden` на любом предке делает его контейнером прокрутки, и
  // sticky прилипает к нему, а не к окну. Проверяем предков колонки: корень
  // страницы и сетку опросника. Корень режет по горизонтали через clip —
  // контейнера прокрутки он не создаёт.
  const body = page.slice(page.indexOf('export default function'))
  const root = body.match(/return \(\s*(?:\/\/[^\n]*\n\s*)*<div className="([^"]+)"/)[1]
  assert.match(root, /overflow-x-clip/)
  assert.ok(!/\boverflow-hidden\b/.test(root), 'overflow-hidden на корне ломает sticky')
  const grid = page.match(/<div className="([^"]*lg:grid-cols-\[[^"]*)"/)[1]
  assert.ok(!/\boverflow-/.test(grid), 'overflow на сетке ломает sticky')
})

test('в меню «Ещё» пункт стоит последним и помечен New', () => {
  const more = header.match(/const moreLinks = \[([\s\S]*?)\n  \]/)
  assert.ok(more, 'в шапке должен быть список moreLinks')
  const entries = more[1].split(/\},?\s*\n/).filter((e) => e.includes('href'))
  const last = entries[entries.length - 1]
  assert.match(last, /\/kvintety-ili-tablicy\.html/, 'пункт должен быть последним в «Ещё»')
  assert.match(last, /badge: 'New'/)
  // Метку рисуют оба списка — десктопный выпадающий и мобильный раскрывающийся.
  assert.equal(header.match(/\{link\.badge && <NewBadge \/>\}/g)?.length, 2)
})

test('build прогоняет пререндер опросника после базы знаний и до пререндера главной', () => {
  const pkg = JSON.parse(readFileSync(resolve(repo, 'package.json'), 'utf8'))
  const build = pkg.scripts.build
  assert.match(build, /prerender-kvintety-ili-tablicy\.mjs/)
  assert.ok(
    build.indexOf('prerender-knowledge-base.mjs') < build.indexOf('prerender-kvintety-ili-tablicy.mjs'),
    'пререндер опросника должен идти после пререндера базы знаний',
  )
  assert.ok(
    build.indexOf('prerender-kvintety-ili-tablicy.mjs') < build.indexOf('prerender-landing.mjs'),
    'пререндер опросника должен идти до пререндера главной (нужен чистый index.html)',
  )
})

test('для страницы рисуется своя OG-карточка', () => {
  const og = readFileSync(resolve(repo, 'scripts/generate-og-images.mjs'), 'utf8')
  assert.match(og, /slug: 'kvintety-ili-tablicy'/)
})

test('prerender пишет crawlable dist/kvintety-ili-tablicy.html со всей таблицей', () => {
  const work = makeWorkspace('kvintety-prerender-')

  execFileSync('node', ['scripts/prerender-kvintety-ili-tablicy.mjs'], { cwd: work })

  const outPath = resolve(work, 'dist/kvintety-ili-tablicy.html')
  assert.ok(existsSync(outPath), 'dist/kvintety-ili-tablicy.html должен быть создан')
  const out = readFileSync(outPath, 'utf8')

  assert.doesNotMatch(out, /<div id="root"><\/div>/, '#root не должен остаться пустым')
  assert.match(out, /<div id="root">\s*<article id="qz-prerender"/)
  // H1 собран из тех же строк, что в React-странице, — целиком он равен QUIZ_META.h1.
  const h1 = out.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1].replace(/<[^>]+>/g, '')
  assert.equal(h1, QUIZ_META.h1)

  // Собственный title и описание в лимитах выдачи.
  const title = out.match(/<title>([\s\S]*?)<\/title>/)[1]
  assert.notEqual(title, homeTitle, 'страница не должна переиспользовать title главной')
  assert.ok(title.length <= 60, `title должен быть <= 60 символов, получено ${title.length}`)
  const desc = out.match(/<meta name="description" content="([\s\S]*?)"/)[1]
  assert.ok(desc.length <= 158, `description должен быть <= 158 символов, получено ${desc.length}`)

  // Self-canonical — то, чего требовал Яндекс.Вебмастер в #410.
  assert.match(out, /<link rel="canonical" href="https:\/\/ideav\.ru\/kvintety-ili-tablicy\.html" \/>/)
  const head = out.slice(0, out.indexOf('</head>'))
  assert.ok(head.includes('rel="canonical"'), 'canonical должен быть внутри <head>')
  assert.match(out, /"@type":"WebPage"/)
  assert.match(out, /"@type":"BreadcrumbList"/)

  // Все ответы всех вопросов — в разметке, без JS.
  const optionCount = QUESTIONS.reduce((a, q) => a + q.o.length, 0)
  assert.equal(
    (out.match(/<tr><td rowspan|<tr><td>/g) ?? []).length >= optionCount,
    true,
    `в таблице должно быть не меньше ${optionCount} строк ответов`,
  )
  for (const q of QUESTIONS) {
    assert.ok(out.includes(q.t.replace(/&/g, '&amp;')), `вопрос «${q.t}» должен быть в снапшоте`)
  }
  // Итоговая строка и перекос.
  assert.match(out, /Потолок баллов и самый трудоёмкий набор ответов/)
  assert.match(out, /\+160 ч/)
  // Ссылка из пояснения развёрнута, а не осталась плейсхолдером.
  assert.doesNotMatch(out, /\{link\}/)
  assert.match(out, /<a href="\/catalog-matching\.html">/)
})

test('prerender не трогает dist/index.html', () => {
  const work = makeWorkspace('kvintety-prerender-home-')
  const before = readFileSync(resolve(work, 'dist/index.html'), 'utf8')
  execFileSync('node', ['scripts/prerender-kvintety-ili-tablicy.mjs'], { cwd: work })
  const after = readFileSync(resolve(work, 'dist/index.html'), 'utf8')
  assert.equal(before, after, 'оболочка главной должна остаться нетронутой')
})

test('prerender падает, если запущен после пререндера главной', () => {
  const work = makeWorkspace('kvintety-prerender-order-')
  execFileSync('node', ['scripts/prerender-landing.mjs'], { cwd: work })
  assert.throws(
    () => execFileSync('node', ['scripts/prerender-kvintety-ili-tablicy.mjs'], { cwd: work, stdio: 'pipe' }),
    /Command failed/,
    'запуск после пререндера главной должен падать громко',
  )
})

test('React-страница и снапшот берут данные из общего источника', () => {
  const page = readFileSync(resolve(repo, 'src/pages/KvintetyIliTablicy.tsx'), 'utf8')
  const script = readFileSync(resolve(repo, 'scripts/prerender-kvintety-ili-tablicy.mjs'), 'utf8')
  assert.match(page, /from '\.\.\/data\/quintetsQuiz'/)
  assert.match(script, /from '\.\.\/src\/data\/quintetsQuiz\.mjs'/)
})
