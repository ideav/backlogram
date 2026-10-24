/**
 * Почтовый дубль заявки оператору на excel-to-app.ru (order_mail_copy).
 *
 * Раньше дубль уходил голым mail() от noreply@excel-to-app.ru: у домена нет
 * ни SPF, ни DKIM, длинные строки не резались (exim такие письма не ведёт),
 * тема не кодировалась. Теперь он идёт общим транспортом intake_mail_send().
 * Проверяем на файловом транспорте: отправитель — welcome@ideav.ru, тема с
 * именем, строки тела укладываются в лимит, без ORDER_EMAIL_TO письма нет.
 */

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { execFileSync } from 'node:child_process'
import { readFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const landingDir = fileURLToPath(new URL('../site-excel/public', import.meta.url))

function mailCopy(env, name) {
  const dir = mkdtempSync(join(tmpdir(), 'order-mail-copy-'))
  const file = join(dir, 'mail.jsonl')
  try {
    execFileSync('php', ['-r', `require 'order-lib.php'; order_mail_copy('Заявка с лендинга', '${name}', str_repeat('длинная строка ', 200), 'excel-to-app.ru');`], {
      cwd: landingDir,
      env: { ...process.env, INTAKE_MAIL_TRANSPORT: 'file', INTAKE_MAIL_FILE: file, ORDER_EMAIL_FROM: '', ...env },
    })
    return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8').trim()) : null
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

const decode = (subject) =>
  subject.split(/\s+/).map((part) => Buffer.from(part.replace(/^=\?UTF-8\?B\?|\?=$/g, ''), 'base64').toString('utf8')).join('')

test('дубль идёт от welcome@ideav.ru, тема с именем, строки в лимите exim', () => {
  const mail = mailCopy({ ORDER_EMAIL_TO: 'ops@example.com' }, 'Иван')
  assert.ok(mail, 'письмо записано')
  assert.equal(mail.to, 'ops@example.com')
  assert.match(mail.headers, /^From: .*<welcome@ideav\.ru>/m)
  assert.equal(decode(mail.subject), 'Заявка с лендинга: Иван')
  for (const line of mail.body.split('\n')) {
    assert.ok(Buffer.byteLength(line) < 998, 'строка тела короче лимита exim')
  }
})

test('без ORDER_EMAIL_TO дубля нет', () => {
  assert.equal(mailCopy({ ORDER_EMAIL_TO: '' }, 'Иван'), null)
})
