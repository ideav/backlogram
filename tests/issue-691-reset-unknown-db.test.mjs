// Issue #691: сброс пароля на integram.io/login.html — базу можно не указывать
// или ввести любую; если такой базы у пользователя нет, пароль уходит от ЛК (my),
// а имя базы запоминается в localStorage, чтобы ЛК предложил её создать.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../integram.io/login.html', import.meta.url), 'utf8');

function extractFunction(name) {
  const start = html.indexOf(`function ${name}(`);
  assert.ok(start !== -1, `function ${name} not found`);
  let depth = 0;
  for (let i = html.indexOf('{', start); i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}' && --depth === 0) return html.slice(start, i + 1);
  }
  throw new Error(`unterminated ${name}`);
}

function load() {
  const ctx = { t9n: (s) => s.replace(/^\[RU\](.*?)\[EN\].*$/s, '$1') };
  vm.createContext(ctx);
  vm.runInContext(['noSuchDbForUser', 'replyText'].map(extractFunction).join('\n'), ctx);
  return ctx;
}

test('#691: нет базы, нет пользователя в базе или ответ не JSON — откат в ЛК', () => {
  const { noSuchDbForUser } = load();
  assert.equal(noSuchDbForUser([{ error: 'База «FN» не найдена' }]), true);
  assert.equal(noSuchDbForUser(undefined), true);
  for (const message of ['dBNotExists', 'WRONG_DB', 'WRONG_CONT'])
    assert.equal(noSuchDbForUser({ message }), true, message);
});

test('#691: прочие ответы не уводят сброс в ЛК', () => {
  const { noSuchDbForUser } = load();
  for (const message of ['MAIL', 'NEW_PWD', 'SMS', 'WRONG', '', undefined])
    assert.equal(noSuchDbForUser({ message }), false, String(message));
});

test('#691: текст ответа берётся и из details, и из массива ошибок', () => {
  const { replyText } = load();
  assert.equal(replyText({ message: 'MAIL', details: 'Пароль отправлен [x]' }), 'Пароль отправлен');
  assert.equal(replyText([{ error: 'База «FN» не найдена' }]), 'База «FN» не найдена');
  assert.equal(replyText(undefined), 'Не удалось сбросить пароль');
});

test('#691: поле базы в сбросе необязательное, пустое — это ЛК', () => {
  const reset = extractFunction('resetPWD');
  assert.doesNotMatch(reset, /#dbReset'\)\.addClass\('is-invalid'\)/);
  assert.match(reset, /\|\|'my'/);
  assert.match(html, /localStorage\.setItem\(WANTED_DB_KEY/);
  assert.match(html, /WANTED_DB_KEY='integram_wanted_db'/);
});
