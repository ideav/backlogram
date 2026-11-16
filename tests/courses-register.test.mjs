// Регистрация на эфир → база ideav.ru/courses (public/courses-register.php).
// Без сети: tests/fixtures/courses-fake-run.php подменяет HTTP фальшивым ядром в памяти.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const hasPhp = spawnSync('php', ['--version'], { stdio: 'ignore' }).error === undefined
const skip = !hasPhp && 'php не найден в PATH'

test('telegram-notify.php: запись в courses подключена после jsonl и не блокирует ответ', () => {
  const src = readFileSync(join(root, 'public/telegram-notify.php'), 'utf8')
  assert.ok(src.includes("require_once __DIR__ . '/courses-register.php'"))
  assert.ok(src.indexOf('intake_registration_append(') < src.indexOf('courses_register_safe('), 'courses после jsonl')
  assert.ok(src.includes('fastcgi_finish_request'), 'ответ посетителю до похода в courses')
})

test('php -l: courses-register.php', { skip }, () => {
  const out = spawnSync('php', ['-l', join(root, 'public/courses-register.php')], { encoding: 'utf8' })
  assert.equal(out.status, 0, out.stdout + out.stderr)
})

test('courses-register: пользователь, профиль, заявка; повтор без дублей; сбои не бросают', { skip }, () => {
  const run = spawnSync('php', [join(root, 'tests/fixtures/courses-fake-run.php')], { encoding: 'utf8' })
  assert.equal(run.status, 0, run.stderr)
  const o = JSON.parse(run.stdout)
  // первая регистрация
  assert.deepEqual(o.first, { ok: true, user_id: '1000', created_user: true, application: 'created', skipped: [], error: null })
  assert.deepEqual([o.afterFirst.users, o.afterFirst.profiles, o.afterFirst.requests], [1, 1, 1])
  assert.equal(o.afterSecond.db['18']['1000'].r[0], 'anna@example.ru', 'логин — почта в нижнем регистре')
  // повтор той же почты в другом регистре
  assert.equal(o.second.created_user, false)
  assert.equal(o.second.application, 'exists')
  assert.deepEqual([o.afterSecond.users, o.afterSecond.profiles, o.afterSecond.requests], [1, 1, 1], 'дубль')
  const prof = o.afterSecond.db['471']['1006'].r
  assert.equal(prof[5], 'Директор', 'профиль обновлён')
  assert.equal(prof[3], '+7 900', 'пустое значение не затёрло поле')
  const req = o.afterSecond.db['472']['1016'].r
  assert.equal(req[2], 'efir')
  assert.equal(req[4], 'регистрация')
  // токен во всех вызовах, короткий тайм-аут
  assert.equal(o.allAuth, true)
  assert.ok(o.maxTimeout <= 4.01)
  // другая почта — другой пользователь
  assert.equal(o.usersAfterThird, 2)
  // сбои
  assert.equal(o.down.ok, false)
  assert.ok(o.down.error.includes('HTTP 500'))
  assert.ok(!JSON.stringify(o.down).includes('tok-secret'), 'токен в тексте ошибки')
  assert.equal(o.noExtras.ok, true)
  assert.deepEqual(o.noExtras.skipped, ['Телефон', 'Компания', 'Должность', 'Отрасль'])
  assert.equal(o.noConfig, null, 'без токена запись отключена')
  assert.equal(o.badEmail.ok, false)
  assert.equal(o.noBudget.ok, false)
})
