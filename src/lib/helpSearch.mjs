// Поиск и «консультант» помощи /help.html (backlogram#946, эпик ideav/crm#5603).
//
// Без сервера и без модели: вопрос своими словами → нормализация (регистр, ё,
// лёгкий стемминг русских окончаний) → синонимы → BM25 по полям статьи с весами →
// лучшие статьи. Консультант собирает из лучшей статьи ответ по шагам, остальные
// показывает как «похожее». Один модуль для React-страницы и для тестов.

const STOP = new Set(
  ('а без бы в во вам вас весь все всё вы где да для до его ее её если есть еще ещё же за и из или им ' +
    'их к как ко когда кто ли либо мне меня мы на над не нет ни но ну о об обо он она они оно от по ' +
    'под при про с со так также там то того тоже только у уже чем что чтобы эта эти это этот я ' +
    'можно нужно надо хочу хотим хотел сделать делать сделаю как-то какой какая какие каким ' +
    'мой моя мои наш наша наши свой своя свои себе ли быть будет был была было есть пожалуйста').split(' '),
)

// Окончания от длинных к коротким; основа не короче 3 букв.
const ENDINGS = (
  'ировать ировании ирование ированный ями ями ами ого его ому ему ыми ими ией иям иях ешь ете ете ' +
  'ать ять ить еть уть ала яла ила ела али или ели ый ий ой ая яя ое ее ые ие ых их ую юю ом ем ам ям ' +
  'ах ях ов ев ей ой ию ия ие ии ью ья ье ы и а я о е у ю ь'
)
  .split(' ')
  .filter(Boolean)
  .sort((a, b) => b.length - a.length)

export function normalize(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[`'"«»“”„(),.;:!?/\\|[\]{}<>=+*&^%$#@~]/g, ' ')
}

export function stem(word) {
  if (!/[а-я]/.test(word) || word.length <= 4) return word
  for (const e of ENDINGS) {
    if (word.endsWith(e) && word.length - e.length >= 3) return word.slice(0, -e.length)
  }
  return word
}

// Группы синонимов: любое слово группы при поиске разворачивается во все.
// Пишутся основами после stem(), поэтому сверяются через stem() при загрузке.
const SYNONYM_GROUPS = [
  ['таблица', 'тип', 'справочник', 'сущность', 'объект', 'список'],
  ['реквизит', 'поле', 'колонка', 'атрибут', 'столбец', 'свойство'],
  ['ссылка', 'связь', 'выпадающий', 'select', 'выбор', 'lookup'],
  ['запрос', 'отчет', 'выборка', 'report', 'sql', 'выгрузка'],
  ['роль', 'права', 'доступ', 'разрешение', 'полномочия', 'grant'],
  ['пользователь', 'сотрудник', 'юзер', 'логин', 'учетка', 'аккаунт'],
  ['кнопка', 'button', 'действие'],
  ['триггер', 'событие', 'автоматически', 'автоматизация', 'хук'],
  ['процедура', 'хранимая', 'скрипт'],
  ['шаблон', 'шаблонизатор', 'html', 'страница', 'верстка', 'форма'],
  ['меню', 'навигация', 'раздел', 'пункт'],
  ['фильтр', 'отбор', 'условие', 'поиск', 'найти', 'искать'],
  ['импорт', 'загрузить', 'загрузка', 'залить', 'перенос', 'перенести', 'переехать'],
  ['excel', 'эксель', 'xlsx', 'csv'],
  ['экспорт', 'выгрузить', 'выгрузка', 'скачать'],
  ['файл', 'вложение', 'картинка', 'фото', 'документ', 'изображение'],
  ['дашборд', 'график', 'диаграмма', 'виджет', 'панель', 'chart'],
  ['api', 'интеграция', 'rest', 'curl', 'json', 'webhook', 'вебхук'],
  ['ии', 'ai', 'агент', 'нейросеть', 'gpt', 'mcp', 'чат', 'llm'],
  ['токен', 'ключ', 'авторизация', 'token', 'вход'],
  ['подчиненный', 'табличный', 'вложенный', 'строки', 'позиции', 'детали'],
  ['итог', 'сумма', 'агрегат', 'подсчет', 'количество', 'группировка'],
  ['статус', 'этап', 'стадия', 'воронка', 'канбан'],
  ['уведомление', 'письмо', 'почта', 'email', 'рассылка', 'telegram', 'телеграм'],
  ['дата', 'срок', 'время', 'календарь', 'расписание'],
  ['удалить', 'удаление', 'стереть', 'очистить'],
  ['копировать', 'копия', 'дублировать', 'клонировать'],
  ['crm', 'клиент', 'продажи', 'сделка', 'контрагент'],
  ['склад', 'остаток', 'номенклатура', 'товар'],
  ['производство', 'планирование', 'цех', 'станок'],
  ['печать', 'печатная', 'pdf', 'бланк'],
]

const SYN = new Map()
for (const group of SYNONYM_GROUPS) {
  const stems = group.map((w) => stem(normalize(w).trim()))
  for (const s of stems) {
    const set = SYN.get(s) ?? new Set()
    stems.forEach((x) => set.add(x))
    SYN.set(s, set)
  }
}

export function tokens(text) {
  return normalize(text)
    .split(/\s+/)
    .flatMap((w) => w.split(/-(?=[а-яa-z])/))
    .filter((w) => w && !STOP.has(w))
    .map(stem)
}

const FIELDS = [
  ['title', 3],
  ['ask', 3],
  ['tags', 2.5],
  ['section', 1],
  ['summary', 1.5],
  ['steps', 1],
  ['body', 0.5],
]

function blockText(b) {
  if (!b) return ''
  return [b.text, b.code, b.label, ...(b.items ?? []), ...(b.head ?? []), ...(b.rows ?? []).flat()]
    .filter(Boolean)
    .join(' ')
}

/** Индекс по плоскому списку статей ({...article, sectionId, sectionTitle}). */
export function buildIndex(articles) {
  const docs = articles.map((a) => {
    const fields = {
      title: tokens(a.title),
      ask: tokens((a.ask ?? []).join(' ')),
      tags: tokens((a.tags ?? []).join(' ')),
      section: tokens(a.sectionTitle ?? ''),
      summary: tokens(a.summary),
      steps: tokens((a.steps ?? []).join(' ')),
      body: tokens((a.blocks ?? []).map(blockText).join(' ')),
    }
    const tf = new Map()
    let len = 0
    for (const [name, w] of FIELDS) {
      for (const t of fields[name]) {
        tf.set(t, (tf.get(t) ?? 0) + w)
        len += w
      }
    }
    return { article: a, tf, len }
  })
  const df = new Map()
  for (const d of docs) for (const t of d.tf.keys()) df.set(t, (df.get(t) ?? 0) + 1)
  const avgLen = docs.reduce((s, d) => s + d.len, 0) / Math.max(docs.length, 1)
  return { docs, df, avgLen, N: docs.length }
}

/** Термы запроса: свой терм с весом 1, синонимы — 0.5. */
function queryTerms(q) {
  const own = tokens(q)
  const terms = new Map()
  for (const t of own) terms.set(t, Math.max(terms.get(t) ?? 0, 1))
  for (const t of own) for (const s of SYN.get(t) ?? []) if (!terms.has(s)) terms.set(s, 0.5)
  return { own, terms }
}

/** Лучшие статьи по запросу: [{ article, score }] по убыванию. */
export function search(index, q, limit = 10) {
  const { own, terms } = queryTerms(q)
  if (!own.length) return []
  const k1 = 1.4
  const b = 0.6
  const out = []
  for (const d of index.docs) {
    let score = 0
    let hits = 0
    for (const [t, qw] of terms) {
      let f = d.tf.get(t) ?? 0
      // Префиксное совпадение для недописанного слова и разных стемов одного корня.
      if (!f && t.length >= 4) {
        for (const [dt, df] of d.tf) if (dt.length >= 4 && (dt.startsWith(t) || t.startsWith(dt))) f = Math.max(f, df * 0.6)
      }
      if (!f) continue
      if (qw === 1) hits++
      const n = index.df.get(t) ?? 1
      const idf = Math.log(1 + (index.N - n + 0.5) / (n + 0.5))
      score += qw * idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * d.len) / index.avgLen)))
    }
    // Рецепты длинные и собирают совпадения объёмом — точная статья-приём должна их обгонять.
    if (d.article.sectionId === 'recipes') score *= 0.8
    if (score > 0) out.push({ article: d.article, score: score * (0.5 + (0.5 * hits) / own.length) })
  }
  return out.sort((x, y) => y.score - x.score).slice(0, limit)
}

/**
 * Ответ консультанта: лучшая статья + похожие. confident=false — совпадение
 * слабое, страница предлагает переформулировать или открыть раздел.
 */
export function consult(index, q) {
  const found = search(index, q, 6)
  if (!found.length) return { best: null, related: [], confident: false }
  const [top, ...rest] = found
  const related = rest.filter((r) => r.score >= top.score * 0.35).slice(0, 4).map((r) => r.article)
  return { best: top.article, related, confident: top.score >= 2.5, score: top.score }
}
