/**
 * Issue #872 — сайт mvp.care (site-mvp/). Сборку запускаем сами (vite build +
 * пререндер, пара секунд) и проверяем итоговые страницы dist-mvp/.
 */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

const root = fileURLToPath(new URL('..', import.meta.url))
const dist = fileURLToPath(new URL('../dist-mvp/', import.meta.url))

// Те же два шага, что в `npm run build:mvp`, но без npm: под `node --test`
// в PATH нет node_modules/.bin.
const run = args => spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8' })
const viteBuild = run(['node_modules/vite/bin/vite.js', 'build', '--config', 'site-mvp/vite.config.ts'])
const build = viteBuild.status === 0 ? run(['scripts/prerender-site-mvp.mjs']) : viteBuild
const read = p => readFileSync(new URL(`../dist-mvp/${p}`, import.meta.url), 'utf8')

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = dir + name
    if (statSync(full).isDirectory()) walk(full + '/', out)
    else out.push(full)
  }
  return out
}

test('build:mvp проходит', () => {
  assert.equal(build.status, 0, build.stdout + build.stderr)
})

test('главная: ключевые тексты, счётчик, реквизиты', () => {
  const html = read('index.html')
  for (const text of ['Замените электронные таблицы', '2500 рублей / час', 'ИП Орехов', 'от 12500 рублей', '2000 рублей / час']) {
    assert.ok(html.includes(text), `нет «${text}»`)
  }
  assert.ok(html.includes('94166541'), 'нет счётчика Метрики')
  assert.match(html, /<link rel="canonical" href="https:\/\/mvp\.care\/"/)
  assert.ok(!html.includes('изменениезаказов'), 'опечатка исходника осталась')
})

test('страницы /success и /ideav_callme со своими мета', () => {
  const success = read('success/index.html')
  assert.ok(success.includes('Спасибо за ваше обращение!'))
  assert.match(success, /rel="canonical" href="https:\/\/mvp\.care\/success"/)
  const callme = read('ideav_callme/index.html')
  assert.ok(callme.includes('Закажите звонок'))
  assert.match(callme, /rel="canonical" href="https:\/\/mvp\.care\/ideav_callme"/)
})

test('в сборке нет следов Тильды', () => {
  for (const file of walk(dist)) {
    if (/\.(png|ico)$/.test(file)) continue
    const text = readFileSync(file, 'utf8').toLowerCase()
    assert.ok(!text.includes('tilda'), `${file}: упоминание Тильды`)
  }
})

test('все пять форм на месте и ведут в order.php', () => {
  const home = read('index.html')
  for (const id of ['phone-hero', 'book-hours', 'phone-save', 'question']) {
    assert.ok(home.includes(`data-form="${id}"`), `нет формы ${id}`)
  }
  assert.ok(read('ideav_callme/index.html').includes('data-form="callme"'))
  assert.ok(existsSync(new URL('../dist-mvp/order.php', import.meta.url)))
  assert.ok(!existsSync(new URL('../dist-mvp/order-config.php', import.meta.url)), 'конфиг с секретами не должен быть в сборке')
})

test('order.php проходит php -l (если php есть)', t => {
  const probe = spawnSync('php', ['-v'], { encoding: 'utf8' })
  if (probe.error || probe.status !== 0) return t.skip('php не установлен')
  for (const file of ['order.php', 'order-config.example.php']) {
    const lint = spawnSync('php', ['-l', fileURLToPath(new URL(`../site-mvp/public/${file}`, import.meta.url))], { encoding: 'utf8' })
    assert.equal(lint.status, 0, lint.stdout + lint.stderr)
  }
})
