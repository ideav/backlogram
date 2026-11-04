/**
 * Issue #873 — сайт finmo.integram.io (site-finmo/). Сборку запускаем сами (vite build +
 * пререндер, пара секунд) и проверяем итоговые страницы dist-finmo/.
 */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

const root = fileURLToPath(new URL('..', import.meta.url))
const dist = fileURLToPath(new URL('../dist-finmo/', import.meta.url))

// Те же два шага, что в `npm run build:finmo`, но без npm: под `node --test`
// в PATH нет node_modules/.bin.
const run = args => spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8' })
const viteBuild = run(['node_modules/vite/bin/vite.js', 'build', '--config', 'site-finmo/vite.config.ts'])
const build = viteBuild.status === 0 ? run(['scripts/prerender-site-finmo.mjs']) : viteBuild
// Типографика ставит &nbsp; (src/lib/typography.mjs) — тексты сверяем с обычными пробелами.
const read = p => readFileSync(new URL(`../dist-finmo/${p}`, import.meta.url), 'utf8').replaceAll('&nbsp;', ' ')

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = dir + name
    if (statSync(full).isDirectory()) walk(full + '/', out)
    else out.push(full)
  }
  return out
}

test('build:finmo проходит', () => {
  assert.equal(build.status, 0, build.stdout + build.stderr)
})

test('главная: ключевые тексты, цены, счётчик, реквизиты', () => {
  const html = read('index.html')
  for (const text of ['Финансовые модели', 'квинтетной модели данных', 'Состав решения', 'Бессрочная лицензия и обновления', 'АО Интеграм, ИНН 9716002710', 'care@integram.io']) {
    assert.ok(html.includes(text), `нет «${text}»`)
  }
  for (const price of ['200 000 рублей', '100 000 рублей', 'от 20 000 ₽', 'от 290 000 ₽']) {
    assert.ok(html.includes(price), `нет цены «${price}»`)
  }
  assert.ok(html.includes('104176620'), 'нет счётчика Метрики')
  assert.ok(html.includes('https://checkout.tochka.com/f6fee065-0172-44f2-9c41-85aaa850d777'), 'нет ссылки на оплату')
  for (const id of ['features', 'proposal', 'contacts', 'callback']) assert.ok(html.includes(`id="${id}"`), `нет якоря #${id}`)
  assert.ok(html.includes('<link rel="canonical" href="https://finmo.integram.io/"'), 'canonical главной')
  assert.ok(!html.includes('не всегда позволяют'), 'опечатка исходника осталась')
})

test('картинки из разметки лежат в сборке', () => {
  const html = read('index.html')
  const srcs = [...html.matchAll(/src="(\/img\/[^"]+)"/g)].map(m => m[1])
  assert.ok(srcs.length >= 7, 'мало картинок: ' + srcs.length)
  for (const src of srcs) assert.ok(existsSync(new URL('../dist-finmo' + src, import.meta.url)), 'нет файла ' + src)
})

test('страница /success со своими мета', () => {
  const success = read('success/index.html')
  assert.ok(success.includes('Спасибо за ваше обращение!'))
  assert.ok(success.includes('rel="canonical" href="https://finmo.integram.io/success"'), 'canonical /success')
  assert.match(success, /noindex/)
})

test('в сборке нет следов Тильды', () => {
  for (const file of walk(dist)) {
    if (/\.(png|ico)$/.test(file)) continue
    const text = readFileSync(file, 'utf8').toLowerCase()
    assert.ok(!text.includes('tilda'), `${file}: упоминание Тильды`)
  }
})

test('форма обратного звонка ведёт в order.php', () => {
  const home = read('index.html')
  assert.ok(home.includes('data-form="callme"'), 'нет формы callme')
  assert.ok(readFileSync(new URL('../site-finmo/public/order.php', import.meta.url), 'utf8').includes("'callme'"), 'order.php не знает форму callme')
  assert.ok(existsSync(new URL('../dist-finmo/order.php', import.meta.url)))
  assert.ok(existsSync(new URL('../dist-finmo/.htaccess', import.meta.url)))
  assert.ok(!existsSync(new URL('../dist-finmo/order-config.php', import.meta.url)), 'конфиг с секретами не должен быть в сборке')
})

test('order.php проходит php -l (если php есть)', t => {
  const probe = spawnSync('php', ['-v'], { encoding: 'utf8' })
  if (probe.error || probe.status !== 0) return t.skip('php не установлен')
  for (const file of ['order.php', 'order-config.example.php']) {
    const lint = spawnSync('php', ['-l', fileURLToPath(new URL(`../site-finmo/public/${file}`, import.meta.url))], { encoding: 'utf8' })
    assert.equal(lint.status, 0, lint.stdout + lint.stderr)
  }
})
