// Описание API для integram.io — вариант src/data/apiDocs.mjs под ядро
// integram.io (ideav/crm integram.io/index.php), backlogram#874.
//
// integram.io работает на своём снапшоте ядра, а не на index.php ideav.ru.
// Поэтому текст берётся из apiDocs.mjs и правится только там, где ядра
// расходятся (сверка с crm origin/main 04.11.2026):
//   • нет `_d_schema`, `_m_batch`, `_m_del_batch`, `fields`, `NAMED`,
//     фильтра `F_{имя колонки}`, выгрузки `json_export`, `field_attrs`;
//   • кука сессии называется `{база}`, а не `idb_{база}`;
//   • ошибка — массив `error`, но HTTP-статус обычно 200;
//   • список таблиц — команда `terms`;
//   • смена пароля через `_m_set` не закрывает сессии;
//   • `_m_del_select` отвечает переадресацией, а не JSON.
// Всё, чего в ядре integram.io нет, тест tests/issue-874-integram-io-api
// не пропустит на страницу.

import { API_INTRO, API_SECTIONS } from './apiDocs.mjs'

export const IO_SITE = 'https://integram.io'

export const API_IO_META = {
  path: '/api.html',
  title: 'API Интеграм: описание команд и примеры curl',
  h1: 'API Интеграм',
  description:
    'Команды API Интеграм на integram.io с примерами curl: авторизация, таблицы и колонки, записи, пользователи, роли, доступы и запросы с фильтрами.',
  keywords:
    'API Интеграм, integram api, integram.io api, curl, REST API базы данных, _m_new, _d_new, metadata, report',
}

export const API_IO_INTRO = [
  API_INTRO[0].replace(/ Этими же командами пользуется сборщик приложений excel-to-app\.$/, ''),
  'Примеры даны для `https://integram.io` и базы `mydb`: подставьте имя своей базы.',
]

// Команды и параметры ядра ideav.ru, которых в ядре integram.io нет.
export const IO_ABSENT = ['_d_schema', '_m_batch', '_m_del_batch', 'NAMED', 'field_attrs', 'json_export', 'fields=', 'idb_']

const H = `${IO_SITE}/mydb`
const AUTH = '-H "X-Authorization: $TOKEN"'
const POST = `${AUTH} -F "_xsrf=$XSRF"`

/** Строки примеров: адрес ideav.ru → integram.io, кука idb_{база} → {база}. */
function retarget(value) {
  if (typeof value === 'string') {
    return value
      .replaceAll('https://ideav.ru', IO_SITE)
      .replaceAll('idb_mydb=', 'mydb=')
      .replaceAll('кука `idb_{база}`', 'кука `{база}`')
  }
  if (Array.isArray(value)) return value.map(retarget)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, retarget(v)]))
  }
  return value
}

const hasText = (b, s) => JSON.stringify(b).includes(s)
const without = (...needles) => (blocks) => blocks.filter((b) => !needles.some((n) => hasText(b, n)))
/** Заменить блок, в тексте которого есть `needle`, на `block`. */
const swap = (needle, block) => (blocks) => {
  const i = blocks.findIndex((b) => hasText(b, needle))
  if (i < 0) throw new Error(`apiDocsIo: нет блока с «${needle}»`)
  return blocks.map((b, j) => (j === i ? block : b))
}
const pipe = (...fns) => (blocks) => fns.reduce((acc, fn) => fn(acc), blocks)

// ───────────────────────────────────────────────────────────────────────────
//  Правки по темам: id темы → новые блоки или функция над прежними
// ───────────────────────────────────────────────────────────────────────────
const TOPIC_PATCH = {
  url: (blocks) =>
    blocks.map((b) =>
      b.t === 'list'
        ? { ...b, items: b.items.map((i) => i.replace('`dict`', '`terms`')) }
        : b,
    ),

  names: [
    { t: 'p', text: 'Таблицы, записи и запросы можно называть в адресе по именам, не зная их id: ядро ищет термин с таким именем, а для записи — запись с таким главным значением.' },
    { t: 'table', head: ['Где', 'Как', 'Пример'], rows: [
      ['Таблица в адресе', 'Имя таблицы вместо её id — в любой команде', '`metadata/Клиент`, `object/Клиент`, `_m_new/Клиент`'],
      ['Запись в адресе', 'Имя таблицы и главное значение записи', '`edit_obj/Клиент/АО Ромашка`, `_m_set/Роль/Менеджер`'],
      ['Запрос в адресе', 'Название запроса вместо id', '`report/Клиенты по категориям`'],
      ['Фильтр запроса', 'Имя колонки в отчёте, пробелы — `_`', '`FR_Дата_заказа=01.10.2026`'],
    ] },
    { t: 'code', lang: 'bash', code: `curl -s ${AUTH} "${H}/metadata/Пользователь?JSON=1"
curl -s ${AUTH} "${H}/edit_obj/Роль/admin?JSON=1"
curl -s ${AUTH} "${H}/report/Клиенты%20по%20категориям?JSON_KV"` },
    { t: 'list', items: [
      'пробел в адресе пишется как `%20`, остальную кириллицу curl передаёт как есть;',
      'поля записи передаются только кодами `t{id колонки}`, фильтры записей — `F_{id колонки}`: id колонок отдаёт `metadata`;',
      'если в базе два термина с одним именем, адрес берёт первый найденный — такие таблицы читайте по id.',
    ] },
  ],

  responses: swap('HTTP-статусом', {
    t: 'p',
    text: 'Ошибка приходит массивом с ключом `error`, и HTTP-статус у неё обычно 200: проверяйте в ответе ключ `error`, а не только код. Свой статус есть у немногих отказов: 401 — нет авторизации или неверный пароль в `auth`, 403 — неверный или устаревший `_xsrf`, 429 — вход временно заблокирован.',
  }),

  'auth-token': swap('кукой `idb_{база}`', {
    t: 'p',
    text: 'Вместо `X-Authorization` подходит `Authorization: <токен>` или `Authorization: Bearer <токен>`. Ещё токен можно передать кукой, названной именем базы (`mydb`), или полем формы `token` в POST-запросе. Кука нужна командам, работающим с сессией, например файловому менеджеру `dir_admin`.',
  }),

  metadata: pipe(
    swap('таблица Пользователь', { t: 'code', lang: 'json', label: 'Ответ (сокращён): таблица Пользователь', code: `{
  "id": "18", "up": "0", "type": "3", "val": "Пользователь", "unique": "1",
  "reqs": [
    {"num": 1, "id": "115", "orig": "42", "val": "Роль", "type": "3", "ref": "42", "ref_id": "114",
     "attrs": ":!NULL:"},
    {"num": 2, "id": "41", "orig": "41", "val": "Email", "type": "3"},
    {"num": 4, "id": "156", "orig": "156", "val": "Дата", "type": "9", "attrs": "[TODAY]"}
  ]
}` }),
    swap('`field_attrs` — атрибуты колонки', { t: 'list', items: [
      '`id` — id таблицы или колонки; `val` — имя; `type` — базовый тип;',
      '`unique` — значения первой колонки уникальны;',
      '`ref` — таблица-справочник у справочной колонки, `ref_id` — id ссылки на неё;',
      '`orig` — термин колонки: у справочной — таблица-справочник, у обычной — сам термин;',
      '`arr_id` — подчинённая таблица;',
      '`attrs` — атрибуты колонки строкой, только если заданы.',
    ] }),
    swap('Атрибуты хранятся', { t: 'p', text: 'Атрибуты хранятся строкой: `:!NULL:` — обязательное поле, `:MULTI:` — множественный выбор, `:ALIAS=Имя:` — псевдоним, а текст вне двоеточий — значение по умолчанию. Например, `:!NULL::ALIAS=Исполнитель:` — обязательная колонка с псевдонимом.' }),
    without('req_field_attrs'),
  ),

  'column-attrs': swap('`_d_null` переключает', {
    t: 'p',
    text: '`_d_null` переключает обязательность колонки. `_d_attrs` задаёт значение по умолчанию: константу или переменную: `[TODAY]` — сегодня, `[USER_ID]` — текущий пользователь. Результат виден в `attrs` колонки в `metadata`.',
  }),

  'object-list': pipe(
    swap('С параметром `NAMED`', { t: 'p', text: 'Справочное значение приходит как `id:Название`, множественное — `id1,id2:Название1,Название2`.' }),
    (blocks) => blocks.map((b) =>
      b.t === 'table'
        ? { ...b, rows: b.rows.map((r) => (r[0] === '`F_{id колонки}=значение`' ? [r[0], 'Фильтр по колонке'] : r)) }
        : b,
    ),
    swap('# по именам таблицы и колонки', { t: 'code', lang: 'bash', code: `# клиенты, в названии которых есть «Ромашка»: %25 — это % в адресе
curl -s ${AUTH} "${H}/object/641/?JSON_OBJ&F_641=%25Ромашка%25"
# позиции заказа 691
curl -s ${AUTH} "${H}/object/700/?JSON_OBJ&F_U=691"
# таблица по имени, фильтр — по id колонки ИНН
curl -s ${AUTH} "${H}/object/Клиент?JSON_OBJ&F_643=7701234567"` }),
    without('NAMED'),
    (blocks) => blocks.filter((b) => !(b.code || '').includes('"Категория": {"id"')), // ответ NAMED
  ),

  'record-new': without('fields=', 'поля — в `fields`'),

  'system-tables': swap('счётчик неудачных входов', {
    t: 'p',
    text: 'Колонки Activity (`t124`) и xsrf (`t40`) заполняет сервер — не пишите в них. Неудачные входы ядро integram.io считает в журнале базы, а не в колонке пользователя.',
  }),

  'record-set': pipe(
    swap('По именам — `fields`', { t: 'p', text: 'Запись можно назвать в адресе по имени таблицы и главному значению:' }),
    swap('fields=', { t: 'code', lang: 'bash', code: `curl -s "${H}/_m_set/Клиент/АО%20Ромашка?JSON=1" \\
  ${POST} -F "t643=7701234568" -F "t646=661"` }),
  ),

  'record-del': pipe(
    swap('`_m_del` удаляет запись', {
      t: 'p',
      text: '`_m_del` удаляет запись вместе с подчинёнными; если на неё ссылаются другие записи, сервер откажет ошибкой в `error`. `_m_move` переносит подчинённую запись к другому родителю, `_m_up` поднимает её на одну позицию среди соседей, `_m_ord` ставит на позицию `order`.',
    }),
    swap('`_m_del_batch`', { t: 'p', text: 'Все записи под фильтром удаляет `object` с `_m_del_select`. Записи, на которые есть ссылки, остаются. Ответ — переадресация, число удалённых — в параметре `deleted` её адреса:' }),
    swap('ids=668', { t: 'code', lang: 'bash', code: `curl -s -o /dev/null -w "%{redirect_url}\\n" "${H}/object/641/?JSON=1&F_646=650" \\
  ${POST} -F "_m_del_select=1"
# → …/object/641?…&deleted=31` }),
  ),

  'role-new': (blocks) => blocks.map((b) =>
    b.t === 'code' ? { ...b, code: b.code.replace('object/Роль?JSON_OBJ&F_Роль=Менеджер', 'object/Роль?JSON_OBJ&F_42=Менеджер') } : b,
  ),

  'user-new': swap('Смена пароля закрывает', {
    t: 'p',
    text: 'Сменить пароль или роль — `_m_set` с id пользователя. Открытые сессии смена пароля не закрывает: выйти на всех устройствах — `exit?all=1` под токеном этого пользователя.',
  }),

  grants: without('_d_schema'),

  'report-run': without('/queries.html'),

  templater: without('/templater.html'),

  backup: swap('`backup` создаёт архив', {
    t: 'p',
    text: '`backup` создаёт архив базы в папке `backups` файлового менеджера. Делайте его перед массовыми изменениями структуры. Выгрузка одной таблицы — `object/{таблица}` с параметром `csv` или `bki`.',
  }),
}

const DICT_AS_TERMS = {
  id: 'terms-list', // 'terms' уже занят темой «Термины»
  title: 'Список таблиц',
  blocks: [
    { t: 'p', text: 'Команда `terms` отдаёт таблицы базы, доступные пользователю: id, базовый тип первой колонки и имя.' },
    { t: 'code', lang: 'bash', code: `curl -s ${AUTH} "${H}/terms?JSON=1"` },
    { t: 'code', lang: 'json', label: 'Ответ', code: '[{"id": 641, "type": 3, "name": "Клиент"}, {"id": 18, "type": 3, "name": "Пользователь"}, {"id": 42, "type": 3, "name": "Роль"}]' },
  ],
}

// Темы и разделы ideav.ru, которых на integram.io нет.
const DROP_TOPICS = new Set(['schema-json', 'batch'])
const DROP_SECTIONS = new Set(['scenario']) // сборщик excel-to-app работает с ideav.ru

function patchTopic(topic) {
  if (topic.id === 'dict') return DICT_AS_TERMS
  const p = TOPIC_PATCH[topic.id]
  if (!p) return topic
  return { ...topic, blocks: Array.isArray(p) ? p : p(topic.blocks) }
}

export const API_IO_SECTIONS = retarget(API_SECTIONS)
  .filter((s) => !DROP_SECTIONS.has(s.id))
  .map((s) => ({
    ...s,
    topics: s.topics.filter((t) => !DROP_TOPICS.has(t.id)).map(patchTopic),
  }))
