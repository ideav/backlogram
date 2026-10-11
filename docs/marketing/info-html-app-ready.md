# Шаблон главной страницы приложения `info.html`

Главная страница демо-приложения, которое собирает ИИ-агент по сервису «Из Excel —
приложение». Дублирует описание приложения и ролей из письма клиенту и — главное —
**держит логины/пароли бизнес-ролей у себя, а не в почте** (issue #622). В письме
клиенту остаётся только одна ссылка и доступ администратора; всё остальное — здесь.

Файл заливается в базу как `templates/custom/<DB>/info.html` (через `dir_admin`) и
отдаётся ядром как домашняя страница базы (`Get_file("info.html")`).

## Что на странице

1. **Описание приложения** — простыми словами, то же, что `business_process`.
2. **Роли** — что делает каждая бизнес-роль и под каким логином заходит.
3. **Блок «Тестовые доступы»** — логины/пароли ролей, отрисовывается клиентски из
   отчёта (пустой отчёт → блок пуст).
4. **Подсказка** — после тестирования под администратором почистить страницу и сменить пароли.
5. **Кнопка «Удалить тестовые пароли»** — с подтверждением; удаляет доступы через
   штатный API в сессии залогиненного админа и перерисовывает блок пустым.

## Данные под блоком доступов (готовит сборщик)

Пароли **не вписываются в HTML статически**. Агент заводит служебную таблицу и
отчёт над ней:

- Таблица **«Демо-доступы»** — по строке на каждую бизнес-роль. Колонки:
  `Роль`, `Логин`, `Пароль`, `Ссылка`.
- Отчёт над ней, который в `JSON_KV` отдаёт колонки: **`id`** (id строки — нужен
  кнопке для удаления), `role`, `login`, `pass`, `url`. Его id сборщик
  подставляет в шаблон в `REPORT_ID`.
- **READ-грант на этот отчёт всем бизнес-ролям** (`_m_new/116`: `up=<roleId>`,
  `t116=<REPORT_ID>`, `t136=53`). Без него блок видит только админ: вошедший по
  «открыть» пользователь роли получает пустой отчёт и уже не может переключиться
  на другую роль (python2node#932).

Так блок «сам пустеет»: после удаления строк отчёт возвращает `[]`.

## Плейсхолдеры ядра (подставляются при отрисовке)

| Плейсхолдер | Значение |
|---|---|
| `{_global_.z}` | имя базы (`<DB>`) |
| `{_global_.xsrf}` | XSRF-токен текущей сессии (нужен для POST-мутаций) |
| `{_global_.user}` / `{_global_.role}` | логин / роль вошедшего пользователя |

## Механика (штатная, как в родном `info.js` / `integram-table.js`)

- **Рендер блока:** `GET /<DB>/report/<REPORT_ID>?JSON_KV` → массив объектов по
  именам колонок отчёта.
- **Удаление строки:** `POST /<DB>/_m_del/<id>?JSON`, тело `_xsrf=<XSRF>`
  (`Content-Type: application/x-www-form-urlencoded`). XSRF — из `{_global_.xsrf}`.
  Кнопка видна только админу (`{_global_.role}` = `admin`): у ролей на отчёт READ.
- **«открыть»** (python2node#932): входит под пользователем строки —
  `POST /<DB>/auth?JSON` с `login`/`pwd`, ядро ставит cookie `idb_<DB>` нового
  пользователя, — затем читает `GET /<DB>` уже под ним, берёт первый пункт меню с
  адресом из `menuData` и переходит на `/<DB>/<href>`. Супер-админ (логин = имя
  базы) уходит на `/<DB>`. `href` ссылки остаётся `start.html?db=…&u=…` — на
  случай открытия в новой вкладке.
- **«скопировать ссылку и пароль»** кладёт в буфер тот же текст, что «конвертик»
  у пароля на форме пользователя (`crm/js/integram-table/20-form-create.js`):
  `Ссылка для входа: https://<host>/start.html?db=<DB>&u=<логин>` и с новой строки
  `Пароль: <пароль>`.

Всё на одной базе (`same-origin`), cookie сессии `idb_<DB>` уходит автоматически.
Это обычная работа админа со своими демо-данными — не затрагивает поля паролей
таблицы «Пользователь», только строки служебной «Демо-доступы».

## Образец `info.html`

```html
<!-- Главная страница демо-приложения. {_global_.*} подставляет ядро при отрисовке. -->
<section class="ig-info">
  <h1>{ProjectName}</h1>

  <h2>Что это за приложение</h2>
  <p>{BusinessProcess}</p>

  <h2>Роли</h2>
  <ul>
    <!-- по одному <li> на бизнес-роль: что делает + ссылка входа -->
    <li><b>Менеджер</b> — оформляет заказы.
      <a href="https://ideav.ru/start.html?db={_global_.z}&u=manager">вход</a></li>
  </ul>

  <h2>Тестовые доступы</h2>
  <div id="ig-creds">Загрузка…</div>

  <p class="ig-hint">
    После тестирования войдите под администратором, нажмите кнопку ниже, чтобы
    стереть тестовые пароли с этой страницы, и <b>смените пароли пользователей</b>
    в настройках — тогда доступы будете знать только вы.
  </p>
  <button id="ig-wipe" class="ig-btn-danger">Удалить тестовые пароли</button>
</section>

<style>
  .ig-info{max-width:760px;margin:0 auto;padding:16px;line-height:1.5}
  .ig-creds-row{padding:8px 0;border-bottom:1px solid #8883}
  .ig-creds-row code{font-size:1.05em}
  .ig-hint{margin-top:24px;opacity:.85}
  .ig-btn-danger{padding:10px 16px;border:0;border-radius:8px;cursor:pointer;
    background:#c0392b;color:#fff;font-size:15px}
  .ig-btn-danger[disabled]{opacity:.5;cursor:default}
</style>

<script>
  const DB = "{_global_.z}";
  const XSRF = "{_global_.xsrf}";
  const ROLE = "{_global_.role}";
  const REPORT_ID = 0; /* id отчёта «Демо-доступы» — подставляет сборщик */

  const box = document.getElementById("ig-creds");
  const btn = document.getElementById("ig-wipe");
  const esc = s => String(s == null ? "" : s).split("&").join("&amp;")
    .split("<").join("&lt;").split(">").join("&gt;").split('"').join("&quot;");
  let creds = [];

  async function loadCreds() {
    const rows = await fetch(`/${DB}/report/${REPORT_ID}?JSON_KV`)
      .then(r => r.json()).catch(() => []);
    creds = Array.isArray(rows) ? rows : [];
    if (!creds.length) {
      box.innerHTML = "<i>Тестовые пароли удалены.</i>";
      btn.style.display = "none";
      return;
    }
    if (ROLE !== "admin") btn.style.display = "none"; /* стирать может только админ */
    box.innerHTML = creds.map((o, i) => `
      <div class="ig-creds-row" data-id="${esc(o.id)}">
        <b>${esc(o.role)}</b> —
        вход: <code>${esc(o.login)}</code> / <code>${esc(o.pass)}</code>
        · <a href="${esc(o.url || startUrl(o.login))}" data-open="${i}">открыть</a>
        · <a href="#" data-copy="${i}">скопировать ссылку и пароль</a>
      </div>`).join("");
  }

  function startUrl(login) {
    return `https://${location.host}/start.html?db=${DB}&u=${encodeURIComponent(login)}`;
  }

  /* Тот же текст, что копирует «конвертик» у пароля на форме пользователя */
  function inviteText(o) {
    return `Ссылка для входа: ${startUrl(o.login)}\nПароль: ${o.pass}`;
  }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) {}
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch (e) {}
    ta.remove();
    return ok;
  }

  /* Вход под пользователем строки и переход в первый пункт его меню */
  async function openAs(o, link) {
    link.textContent = "входим…";
    try {
      const body = new URLSearchParams({ login: o.login, pwd: o.pass });
      const r = await fetch(`/${DB}/auth?JSON`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.token) throw new Error(j.error || "вход не удался");
      if (String(o.login).toLowerCase() === DB.toLowerCase()) {
        location.href = `/${DB}`; /* супер-админ — на главную */
        return;
      }
      const html = await fetch(`/${DB}`).then(x => x.text());
      const menu = (html.match(/var menuData = \[([\s\S]*?)\];/) || [])[1] || "";
      const first = [...menu.matchAll(/href:'([^']*)'/g)].map(m => m[1]).find(Boolean);
      location.href = first ? `/${DB}/${first}` : `/${DB}`;
    } catch (e) {
      link.textContent = "открыть";
      alert(`Не удалось войти как ${o.login}: ${e.message}`);
    }
  }

  box.addEventListener("click", async ev => {
    const a = ev.target.closest("a[data-open],a[data-copy]");
    if (!a) return;
    ev.preventDefault();
    if (a.dataset.open !== undefined) return openAs(creds[+a.dataset.open], a);
    const ok = await copyText(inviteText(creds[+a.dataset.copy]));
    const label = a.textContent;
    a.textContent = ok ? "скопировано" : "не удалось скопировать";
    setTimeout(() => { a.textContent = label; }, 2000);
  });

  async function delRow(id) {
    const body = new URLSearchParams({ _xsrf: XSRF });
    return fetch(`/${DB}/_m_del/${id}?JSON`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
  }

  btn.addEventListener("click", async () => {
    if (!confirm("Стереть тестовые пароли с этой страницы? Отменить нельзя.")) return;
    btn.disabled = true;
    const ids = [...box.querySelectorAll(".ig-creds-row")]
      .map(el => el.dataset.id).filter(Boolean);
    for (const id of ids) {
      try { await delRow(id); } catch (e) { /* продолжаем остальные */ }
    }
    await loadCreds();
    btn.disabled = false;
  });

  loadCreds();
</script>
```

## Проверка после сборки

- Открыть базу под админом — блок «Тестовые доступы» показывает строки из отчёта.
- «открыть» у роли → вход под её пользователем и первый пункт её меню; на главной
  под этой ролью блок доступов тоже виден, «открыть» у другой роли переключает.
- «скопировать ссылку и пароль» → в буфере две строки «Ссылка для входа: …» /
  «Пароль: …».
- Нажать «Удалить тестовые пароли» → подтвердить → строки исчезли, при
  перезагрузке страницы блок остаётся пустым (данные удалены на сервере).
- В письме/сообщении клиенту — только ссылка и доступ администратора
  (см. [email-template-app-ready.md](email-template-app-ready.md)).
