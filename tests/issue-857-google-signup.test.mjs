// Issue #857: на integram.io/login.html вернуть вход и регистрацию через Google,
// как в старом ядре. Серверная часть — обработчик /auth.asp в crm/integram.io/index.php.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../integram.io/login.html', import.meta.url), 'utf8');
const withoutComments = html.replace(/<!--[\s\S]*?-->/g, '');

test('#857: кнопка Google не закомментирована и зовёт googel()', () => {
  assert.match(withoutComments, /<div class="d-grid googel">[\s\S]*?onclick="googel\(\)"/);
  assert.match(withoutComments, /type="button" onclick="googel\(\)"/, 'кнопка не должна сабмитить форму');
});

test('#857: подпись кнопки зависит от режима — вход или регистрация', () => {
  assert.match(withoutComments, /class="g-login"[\s\S]*?Sign in with Google/);
  assert.match(withoutComments, /class="g-reg" style="display:none;"[\s\S]*?Sign up with Google/);
  assert.match(html, /\$\('\.reg,\.login,\.g-reg,\.g-login'\)\.toggle\(\);\s*mode='reg';/, '#reg открывает регистрацию с подписью «Sign up»');
  assert.match(html, /function formMode\(\)\{[\s\S]*?\$\('\.g-reg,\.g-login'\)\.toggle\(\);/, 'переключение режима меняет подпись');
});

test('#857: OAuth ведёт на /auth.asp текущего хоста', () => {
  assert.match(html, /accounts\.google\.com\/o\/oauth2\/auth\?client_id=[\w.-]+\.apps\.googleusercontent\.com/);
  assert.match(html, /redirect_uri=https:\/\/'\+document\.location\.host\+'\/auth\.asp/);
  assert.match(html, /userinfo\.email/);
});

test('#857: в режиме смены пароля кнопки Google нет', () => {
  assert.match(html, /\$\('\.reg,\.login,\.googel'\)\.remove\(\);/);
});
