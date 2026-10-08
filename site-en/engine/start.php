<?php
# /start: log in, sign up (/start#signup) and password reset. Served for /start and /start.html.
# Talks to the engine: POST /<db>/auth?JSON (login, reset), POST /my/register?JSON (sign-up),
# GET /auth/google and /auth/github (OAuth).
function start_env($k, $d = ''){ $v = getenv($k); return ($v === false || $v === '') ? $d : $v; }
$dotenv = start_env('INTEGRAM_ENV_FILE', __DIR__.'/.env');
if(is_file($dotenv))
    foreach(file($dotenv, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line){
        $line = trim($line);
        if($line === '' || $line[0] === '#' || strpos($line, '=') === false) continue;
        list($k, $v) = array_map('trim', explode('=', $line, 2));
        if(strlen($v) > 1 && ($v[0] === '"' || $v[0] === "'") && substr($v, -1) === $v[0]) $v = substr($v, 1, -1);
        if(getenv($k) === false) putenv("$k=$v");
    }
$turnstile = start_env('INTEGRAM_TURNSTILE_SITEKEY');
$google = start_env('INTEGRAM_GOOGLE_CLIENT_ID') !== '';
$github = start_env('INTEGRAM_GITHUB_CLIENT_ID') !== '';
$h = function($s){ return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); };
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
header('X-Frame-Options: DENY');
header('Referrer-Policy: strict-origin-when-cross-origin');
?><!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Log in · Integram</title>
<link rel="icon" href="/favicon.ico">
<style>
:root{--bg:#f8fafc;--card:#fff;--text:#0f172a;--muted:#475569;--line:#e2e8f0;--brand:#2563eb;--brand-d:#1d4ed8;--err:#b91c1c;--err-bg:#fef2f2;--ok:#166534;--ok-bg:#f0fdf4;--focus:rgba(37,99,235,.25)}
*{box-sizing:border-box}
html,body{margin:0;min-height:100%}
body{font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:var(--text);background:var(--bg);display:flex;flex-direction:column;min-height:100vh}
a{color:var(--brand);text-decoration:none}a:hover{text-decoration:underline}
header{padding:20px 24px}
.logo{display:inline-flex;align-items:center;gap:10px;font-weight:700;font-size:20px;color:var(--text)}
.logo:hover{text-decoration:none}
.logo i{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,#2563eb,#7c3aed);display:inline-block}
main{flex:1;display:flex;align-items:flex-start;justify-content:center;padding:24px 16px 48px}
.card{width:100%;max-width:420px;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:32px;box-shadow:0 10px 30px rgba(15,23,42,.06)}
h1{font-size:24px;line-height:1.25;margin:0 0 6px}
.sub{color:var(--muted);margin:0 0 24px;font-size:15px}
.oauth{display:grid;gap:10px}
.btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;height:44px;border-radius:10px;border:1px solid var(--line);background:#fff;color:var(--text);font:600 15px/1 inherit;cursor:pointer;transition:background .15s,border-color .15s}
.btn:hover{background:#f1f5f9;text-decoration:none}
.btn:focus-visible,input:focus-visible{outline:none;box-shadow:0 0 0 4px var(--focus)}
.btn.primary{background:var(--brand);border-color:var(--brand);color:#fff}
.btn.primary:hover{background:var(--brand-d)}
.btn[disabled]{opacity:.6;cursor:progress}
.btn svg{width:18px;height:18px;flex:none}
.sep{display:flex;align-items:center;gap:12px;color:#94a3b8;font-size:13px;margin:20px 0}
.sep:before,.sep:after{content:"";flex:1;height:1px;background:var(--line)}
label{display:block;font-size:14px;font-weight:600;margin:0 0 6px}
.field{margin-bottom:14px}
input[type=email],input[type=password],input[type=text]{width:100%;height:44px;padding:0 12px;border:1px solid #cbd5e1;border-radius:10px;font:inherit;color:var(--text);background:#fff}
.row{display:flex;justify-content:space-between;align-items:center;margin:-4px 0 14px;font-size:14px}
.check{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:var(--muted);margin:4px 0 16px}
.check input{margin-top:3px}
.hp{position:absolute!important;left:-10000px!important;width:1px;height:1px;overflow:hidden}
.msg{display:none;border-radius:10px;padding:10px 12px;font-size:14px;margin-bottom:16px}
.msg.err{display:block;background:var(--err-bg);color:var(--err)}
.msg.ok{display:block;background:var(--ok-bg);color:var(--ok)}
.switch{text-align:center;color:var(--muted);font-size:14px;margin-top:20px}
.ts{margin:4px 0 14px}
.view{display:none}.view.on{display:block}
footer{text-align:center;color:#94a3b8;font-size:13px;padding:16px}
footer a{color:#64748b;margin:0 8px}
@media (prefers-color-scheme:dark){:root{--bg:#0b1120;--card:#111827;--text:#e5e7eb;--muted:#94a3b8;--line:#1f2937;--err-bg:#3f1d1d;--err:#fca5a5;--ok-bg:#052e16;--ok:#86efac}
.btn{background:#0f172a;color:var(--text)}.btn:hover{background:#1e293b}input[type=email],input[type=password],input[type=text]{background:#0f172a;border-color:#334155}}
@media (max-width:480px){.card{padding:24px 20px;border-radius:12px}}
</style>
<?php if($turnstile !== ''): ?><script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script><?php endif; ?>
</head>
<body>
<header><a class="logo" href="/"><i aria-hidden="true"></i>Integram</a></header>
<main>
<div class="card">
  <div id="msg" class="msg" role="alert" aria-live="polite"></div>

  <section id="view-login" class="view on" aria-labelledby="t-login">
    <h1 id="t-login">Log in to Integram</h1>
    <p class="sub" id="login-sub">Welcome back. Pick up where you left off.</p>
    <div class="oauth" data-oauth></div>
    <div class="sep" data-sep>or with email</div>
    <form id="f-login" novalidate>
      <div class="hp" aria-hidden="true"><label>Website <input name="website" tabindex="-1" autocomplete="off"></label></div>
      <div class="field"><label for="l-email">Email</label><input id="l-email" name="login" type="email" autocomplete="username" required></div>
      <div class="field"><label for="l-pwd">Password</label><input id="l-pwd" name="pwd" type="password" autocomplete="current-password" required></div>
      <div class="row"><span></span><a href="#reset">Forgot password?</a></div>
      <button class="btn primary" type="submit">Log in</button>
    </form>
    <p class="switch">New to Integram? <a href="#signup">Create a free account</a></p>
  </section>

  <section id="view-signup" class="view" aria-labelledby="t-signup">
    <h1 id="t-signup">Create your free account</h1>
    <p class="sub">Your own workspace in under a minute. No credit card.</p>
    <div class="oauth" data-oauth></div>
    <div class="sep" data-sep>or with email</div>
    <form id="f-signup" novalidate>
      <div class="hp" aria-hidden="true"><label>Website <input name="website" tabindex="-1" autocomplete="off"></label></div>
      <div class="field"><label for="s-email">Work email</label><input id="s-email" name="email" type="email" autocomplete="email" required></div>
      <div class="field"><label for="s-pwd">Password</label><input id="s-pwd" name="regpwd" type="password" autocomplete="new-password" minlength="8" required placeholder="At least 8 characters"></div>
      <label class="check"><input type="checkbox" name="agree" value="1" required> <span>I agree to the <a href="/terms" target="_blank">Terms of Service</a> and the <a href="/privacy" target="_blank">Privacy Policy</a>.</span></label>
      <?php if($turnstile !== ''): ?><div class="ts cf-turnstile" data-sitekey="<?= $h($turnstile) ?>"></div><?php endif; ?>
      <button class="btn primary" type="submit">Create account</button>
    </form>
    <p class="switch">Already have an account? <a href="#login">Log in</a></p>
  </section>

  <section id="view-reset" class="view" aria-labelledby="t-reset">
    <h1 id="t-reset">Reset your password</h1>
    <p class="sub">Enter the email you signed up with. We'll send you a new password and a link to activate it.</p>
    <form id="f-reset" novalidate>
      <div class="hp" aria-hidden="true"><label>Website <input name="website" tabindex="-1" autocomplete="off"></label></div>
      <div class="field"><label for="r-email">Email</label><input id="r-email" name="login" type="email" autocomplete="email" required></div>
      <?php if($turnstile !== ''): ?><div class="ts cf-turnstile" data-sitekey="<?= $h($turnstile) ?>"></div><?php endif; ?>
      <button class="btn primary" type="submit">Send reset email</button>
    </form>
    <p class="switch"><a href="#login">Back to log in</a></p>
  </section>
</div>
</main>
<footer><a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="/contact">Contact</a></footer>
<script>
(function () {
  'use strict';
  var OAUTH = { google: <?= $google ? 'true' : 'false' ?>, github: <?= $github ? 'true' : 'false' ?> };
  var ICONS = {
    google: '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>',
    github: '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>'
  };
  var qs = new URLSearchParams(location.search);
  var db = (qs.get('db') || 'my').toLowerCase();
  if (!/^[a-z0-9_]{1,15}$/.test(db)) db = 'my';
  var msg = document.getElementById('msg');

  function show(text, ok) { msg.textContent = text; msg.className = 'msg ' + (ok ? 'ok' : 'err'); }
  function clear() { msg.textContent = ''; msg.className = 'msg'; }

  // OAuth buttons (only providers configured on the server)
  document.querySelectorAll('[data-oauth]').forEach(function (box) {
    ['google', 'github'].forEach(function (p) {
      if (!OAUTH[p]) return;
      var a = document.createElement('a');
      a.className = 'btn'; a.href = '/auth/' + p;
      a.innerHTML = ICONS[p] + '<span>Continue with ' + (p === 'google' ? 'Google' : 'GitHub') + '</span>';
      box.appendChild(a);
    });
    if (!box.children.length) { box.style.display = 'none'; box.nextElementSibling.style.display = 'none'; }
  });

  function route() {
    var v = (location.hash || '#login').slice(1);
    if (['login', 'signup', 'reset'].indexOf(v) < 0) v = 'login';
    document.querySelectorAll('.view').forEach(function (s) { s.classList.toggle('on', s.id === 'view-' + v); });
    document.title = (v === 'signup' ? 'Sign up' : v === 'reset' ? 'Reset password' : 'Log in') + ' · Integram';
    var first = document.querySelector('#view-' + v + ' input[type=email]');
    if (first && !('ontouchstart' in window)) first.focus();
  }
  window.addEventListener('hashchange', function () { clear(); route(); });
  route();
  if (db !== 'my') document.getElementById('login-sub').textContent = 'Log in to the "' + db + '" workspace.';
  if (qs.get('login')) { document.getElementById('l-email').value = qs.get('login'); document.getElementById('r-email').value = qs.get('login'); }

  // Messages passed back by the engine (login(): ?r=<code>&d=<details>)
  var R = {
    toConfirm: ['Almost there! We sent a confirmation link to your email. Open it to activate your account.', true],
    wrong: ['Wrong email or password.'],
    EXPIRED: ['This confirmation link is invalid or has already been used. Try logging in.'],
    obsolete: ['This password reset link has expired. Request a new one.'],
    dBNotExists: ['This workspace does not exist. Log in to see your workspaces.'],
    oauthError: ['Sign-in failed.'],
    MAIL: ['We emailed you a new password. Open the link in the email to activate it.', true],
    NEW_PWD: ['We emailed you a password.', true],
    WRONG_CONT: ["We couldn't find an account with this email."],
    InvalidToken: ['Your session has expired. Please log in again.'],
    confirm: ['Your new password is active. Log in with it.', true]
  };
  var r = qs.get('r'), d = qs.get('d');
  if (r && R[r]) show(R[r][0] + (d && !R[r][1] ? ' ' + d : ''), !!R[r][1]);
  else if (r && d) show(d);

  function errorText(data, fallback) {
    if (Array.isArray(data) && data[0] && data[0].error) data = data[0].error;
    else if (data && typeof data === 'object') data = data.error || data.msg || data.details || data.message;
    data = String(data || fallback || 'Something went wrong. Please try again.');
    return data.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/\s*\[\w+\]\s*$/, '').replace(/\s+/g, ' ').trim();
  }
  function post(url, form, extra) {
    var body = new URLSearchParams(new FormData(form));
    Object.keys(extra || {}).forEach(function (k) { body.set(k, extra[k]); });
    return fetch(url, { method: 'POST', credentials: 'include', body: body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
      .then(function (res) { return res.text().then(function (t) { var j; try { j = JSON.parse(t); } catch (e) { j = t; } return { ok: res.ok, status: res.status, data: j }; }); });
  }
  function busy(form, on) { var b = form.querySelector('button[type=submit]'); b.disabled = on; }
  function resetTurnstile(form) { if (window.turnstile && form.querySelector('.cf-turnstile')) try { window.turnstile.reset(form.querySelector('.cf-turnstile')); } catch (e) {} }

  document.getElementById('f-login').addEventListener('submit', function (e) {
    e.preventDefault(); var f = e.target; clear();
    if (!f.login.value || !f.pwd.value) return show('Enter your email and password.');
    busy(f, true);
    post('/' + db + '/auth?JSON', f, { login: f.login.value.trim().toLowerCase(), db: db }).then(function (r) {
      busy(f, false);
      if (r.ok && r.data && r.data.token && !r.data.msg) {
        var uri = qs.get('uri') || '';
        location.href = (uri.indexOf('/' + db) === 0 && uri.indexOf('//') !== 0) ? uri : '/' + db;
      } else if (r.data && r.data.message === 'reenter') {
        location.reload();
      } else show(r.status === 401 ? 'Wrong email or password.' : errorText(r.data));
    }).catch(function () { busy(f, false); show('Network error. Please try again.'); });
  });

  document.getElementById('f-signup').addEventListener('submit', function (e) {
    e.preventDefault(); var f = e.target; clear();
    var email = f.email.value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return show('Please enter a valid email address.');
    if (f.regpwd.value.length < 8) return show('The password must be at least 8 characters long.');
    if (!f.agree.checked) return show('Please accept the Terms of Service and the Privacy Policy.');
    busy(f, true);
    post('/my/register?JSON', f, { email: email, regpwd1: f.regpwd.value }).then(function (r) {
      busy(f, false); resetTurnstile(f);
      if (r.data && r.data.message === 'toConfirm') {
        f.reset(); show('Almost there! We sent a confirmation link to ' + email + '. Open it to activate your account (check the Spam folder too).', true);
      } else show(errorText(r.data));
    }).catch(function () { busy(f, false); show('Network error. Please try again.'); });
  });

  document.getElementById('f-reset').addEventListener('submit', function (e) {
    e.preventDefault(); var f = e.target; clear();
    if (!f.login.value) return show('Enter your email.');
    busy(f, true);
    post('/' + db + '/auth?JSON', f, { login: f.login.value.trim().toLowerCase(), reset: '1', db: db }).then(function (r) {
      busy(f, false); resetTurnstile(f);
      var m = r.data && r.data.message;
      if (m === 'MAIL' || m === 'NEW_PWD') show(R[m][0], true);
      else if (m && R[m]) show(R[m][0]);
      else show(errorText(r.data));
    }).catch(function () { busy(f, false); show('Network error. Please try again.'); });
  });
})();
</script>
</body>
</html>
