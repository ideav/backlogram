// Фоны hero /put-adepta.html: ротация тем через куку и передача темы с заявкой.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  ADEPT_HEROES,
  ADEPT_HERO_COOKIE,
  adeptHeroCookie,
  nextAdeptHero,
  readAdeptHeroCookie,
} from '../src/data/adeptHero.mjs'

const root = join(import.meta.dirname, '..')

test('тем несколько, id уникальны, картинки лежат в public/', () => {
  assert.ok(ADEPT_HEROES.length >= 4)
  assert.equal(new Set(ADEPT_HEROES.map(h => h.id)).size, ADEPT_HEROES.length)
  for (const h of ADEPT_HEROES) {
    assert.ok(existsSync(join(root, 'public', h.src)), h.src)
    assert.ok(existsSync(join(root, 'scripts/adept-hero', `${h.id}.mjs`)), h.id)
  }
  assert.ok(ADEPT_HEROES.some(h => h.id === 'samurai'))
  assert.ok(ADEPT_HEROES.some(h => h.id === 'anime'))
})

test('ротация: каждый заход — следующая тема по кругу, полный цикл без повторов', () => {
  let last = ADEPT_HEROES[0].id
  const seen = []
  for (let i = 0; i < ADEPT_HEROES.length; i++) {
    const next = nextAdeptHero(last)
    assert.notEqual(next.id, last)
    seen.push(next.id)
    last = next.id
  }
  assert.equal(new Set(seen).size, ADEPT_HEROES.length)
})

test('без куки или с чужим id — случайная тема', () => {
  assert.equal(nextAdeptHero(null, () => 0).id, ADEPT_HEROES[0].id)
  assert.equal(nextAdeptHero('нет-такой', () => 0.999).id, ADEPT_HEROES.at(-1).id)
})

test('кука пишется и читается', () => {
  const c = adeptHeroCookie('cyberpunk')
  assert.match(c, new RegExp(`^${ADEPT_HERO_COOKIE}=cyberpunk;`))
  assert.match(c, /path=\//)
  assert.match(c, /max-age=\d+/)
  assert.equal(readAdeptHeroCookie(`a=1; ${ADEPT_HERO_COOKIE}=anime; idb_x=2`), 'anime')
  assert.equal(readAdeptHeroCookie(`${ADEPT_HERO_COOKIE}=samurai`), 'samurai')
  assert.equal(readAdeptHeroCookie('xideav_adept_hero=anime'), null)
  assert.equal(readAdeptHeroCookie(''), null)
})

test('страница берёт тему из куки и шлёт её с заявкой и в Метрику', () => {
  const src = readFileSync(join(root, 'src/pages/AdeptPath.tsx'), 'utf8')
  assert.match(src, /nextAdeptHero\(readAdeptHeroCookie\(document\.cookie\)\)/)
  assert.match(src, /document\.cookie = adeptHeroCookie\(/)
  assert.match(src, /Картинка hero: \$\{hero\.id\}/)
  assert.match(src, /reachGoal\('lead', \{ source: 'adept', adept_hero: hero\.id \}\)/)
  assert.match(src, /visitParams\(\{ adept_hero: hero\.id \}\)/)
})
