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
4. **Подсказка** — после тестирования почистить страницу и сменить пароли.
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
    После тестирования нажмите кнопку ниже, чтобы стереть тестовые пароли с этой
    страницы, и <b>смените пароли пользователей</b> в настройках — тогда доступы
    будете знать только вы.
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
  const REPORT_ID = 0; /* id отчёта «Демо-доступы» — подставляет сборщик */

  const box = document.getElementById("ig-creds");
  const btn = document.getElementById("ig-wipe");

  async function loadCreds() {
    const rows = await fetch(`/${DB}/report/${REPORT_ID}?JSON_KV`)
      .then(r => r.json()).catch(() => []);
    if (!rows.length) {
      box.innerHTML = "<i>Тестовые пароли удалены.</i>";
      btn.style.display = "none";
      return;
    }
    box.innerHTML = rows.map(o => `
      <div class="ig-creds-row" data-id="${o.id}">
        <b>${o.role || ""}</b> —
        вход: <code>${o.login || ""}</code> / <code>${o.pass || ""}</code>
        ${o.url ? ` · <a href="${o.url}">открыть</a>` : ""}
      </div>`).join("");
  }

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
- Нажать «Удалить тестовые пароли» → подтвердить → строки исчезли, при
  перезагрузке страницы блок остаётся пустым (данные удалены на сервере).
- В письме/сообщении клиенту — только ссылка и доступ администратора
  (см. [email-template-app-ready.md](email-template-app-ready.md)).
