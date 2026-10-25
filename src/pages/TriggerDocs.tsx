import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Copy, Hammer } from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs'
import { Block, Inline } from './ApiDocs'
import { TRIGGER_META, TRIGGER_INTRO, TRIGGER_SECTIONS } from '../data/triggerDocs'
import type { TriggerSection } from '../data/triggerDocs'

const SITE = 'https://ideav.ru'

type ActionType = 'query' | 'prompt' | 'formula' | 'link'

const EVENT_ORDER = ['PRESS', 'READ', 'CREATE', 'UPDATE', 'DELETE'] as const
type EventName = (typeof EVENT_ORDER)[number]

const EVENT_HINTS: Record<EventName, string> = {
  PRESS: 'по нажатию',
  READ: 'при показе',
  CREATE: 'при создании',
  UPDATE: 'при изменении',
  DELETE: 'при удалении',
}

const FIELD_LABELS: Record<ActionType, { label: string; placeholder: string }> = {
  query: { label: 'Имя запроса', placeholder: 'Долг клиента' },
  prompt: { label: 'Промпт', placeholder: 'Составь описание товара: {Название}, цена {Цена} ₽' },
  formula: { label: 'Формула', placeholder: 'ROUND({Цена} * {Количество}, 2)' },
  link: { label: 'Адрес ссылки', placeholder: 'https://example.com/card/[ID]' },
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
      />
    </label>
  )
}

/**
 * Интерактивный сборщик JSON действия кнопки (python2node#866): тип, события
 * запуска, условие и исполнитель — на выходе модификатор `action` и команда
 * `curl` для `_d_action`. Ключи со значениями по умолчанию не выводятся.
 */
function ActionBuilder() {
  const [type, setType] = useState<ActionType>('query')
  const [events, setEvents] = useState<Set<EventName>>(() => new Set<EventName>(['PRESS']))
  const [value, setValue] = useState('')
  const [params, setParams] = useState('FR_Клиент=[VAL]')
  const [label, setLabel] = useState('')
  const [when, setWhen] = useState('')
  const [user, setUser] = useState('')
  const [write, setWrite] = useState(true)
  const [recompute, setRecompute] = useState(false)
  const [copied, setCopied] = useState<'json' | 'curl' | null>(null)

  const isLink = type === 'link'

  const toggleEvent = (name: EventName) => {
    setEvents((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      if (next.size === 0) next.add('PRESS')
      return next
    })
  }

  const action = useMemo(() => {
    // Порядок ключей — как в справочнике: тип, поля типа, потом общие.
    if (isLink) {
      const a: Record<string, unknown> = { type, url: value || 'https://…/[ID]' }
      if (label) a.label = label
      return a
    }
    const a: Record<string, unknown> = { type }
    if (type === 'query') {
      a.query = value || 'Имя запроса'
      if (params) a.params = params
    }
    if (type === 'prompt') a.prompt = value || 'Опиши {Название}'
    if (type === 'formula') a.formula = value || '{Цена} * {Количество}'
    if (write) a.write = true
    if (label) a.label = label
    if (recompute) a.recompute = true
    if (when) a.when = when
    if (user) a.user = user
    a.on = EVENT_ORDER.filter((e) => events.has(e))
    if (a.on.length === 1 && a.on[0] === 'PRESS') delete a.on // значение по умолчанию
    return a
  }, [type, isLink, value, params, label, when, user, write, recompute, events])

  const json = JSON.stringify(action)
  const curl = `curl -s -X POST -H "X-Authorization: $TOKEN" \\\n  -F "_xsrf=$XSRF" \\\n  -F 'action=${json}' \\\n  "https://ideav.ru/mydb/_d_action/{id колонки}?JSON"`

  const copy = (what: 'json' | 'curl') => {
    navigator.clipboard?.writeText(what === 'json' ? json : curl).then(() => {
      setCopied(what)
      setTimeout(() => setCopied(null), 1500)
    }).catch(() => {})
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-4 sm:p-6 space-y-5">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Что делает кнопка</div>
        <div className="flex flex-wrap gap-2">
          {(['query', 'prompt', 'formula', 'link'] as ActionType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setType(t); setEvents(new Set<EventName>(['PRESS'])) }}
              className={
                'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ' +
                (type === t
                  ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-400')
              }
            >
              {t === 'query' ? 'Запрос' : t === 'prompt' ? 'Промпт ИИ' : t === 'formula' ? 'Формула' : 'Ссылка'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={FIELD_LABELS[type].label} value={value} onChange={setValue} placeholder={FIELD_LABELS[type].placeholder} />
        {type === 'query' && (
          <Field label="Параметры (строка адреса отчёта)" value={params} onChange={setParams} placeholder="FR_Клиент=[VAL]" />
        )}
        <Field label="Подпись кнопки (необязательно)" value={label} onChange={setLabel} placeholder="Долг" />
        {!isLink && <Field label="Условие — формула, необязательно" value={when} onChange={setWhen} placeholder='{Статус} = "Оплачен"' />}
        {!isLink && <Field label="Выполнять от имени (логин, необязательно)" value={user} onChange={setUser} placeholder="ivanov" />}
      </div>

      {!isLink && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <label className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={write} onChange={(e) => setWrite(e.target.checked)} className="accent-blue-500" />
            Записывать результат в поле записи
          </label>
          {events.has('READ') && (
            <label className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <input type="checkbox" checked={recompute} onChange={(e) => setRecompute(e.target.checked)} className="accent-blue-500" />
              Пересчитывать при каждом показе
            </label>
          )}
        </div>
      )}

      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Когда запускать</div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {EVENT_ORDER.map((name) => {
            const disabled = isLink && name !== 'PRESS'
            const checked = isLink || events.has(name)
            return (
              <label
                key={name}
                className={'inline-flex items-center gap-2 ' + (disabled ? 'text-slate-400 dark:text-slate-600' : 'text-slate-600 dark:text-slate-300')}
                title={disabled ? 'ссылка запускается только нажатием' : undefined}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggleEvent(name)}
                  className="accent-blue-500"
                />
                <code className="font-mono text-[0.85em]">{name}</code>
                <span className="text-slate-400 dark:text-slate-500">{EVENT_HINTS[name]}</span>
              </label>
            )
          })}
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <pre className="rounded-xl bg-slate-900 text-slate-100 text-sm leading-relaxed p-4 pr-12 overflow-x-auto"><code>{json}</code></pre>
          <button
            type="button"
            onClick={() => copy('json')}
            aria-label="Скопировать JSON"
            className="absolute right-2 top-2 p-1.5 rounded-md bg-slate-800 text-slate-300 opacity-70 hover:opacity-100 transition-opacity"
          >
            {copied === 'json' ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
        {!isLink && (
          <div className="relative">
            <pre className="rounded-xl bg-slate-900 text-slate-100 text-sm leading-relaxed p-4 pr-12 overflow-x-auto"><code>{curl}</code></pre>
            <button
              type="button"
              onClick={() => copy('curl')}
              aria-label="Скопировать команду"
              className="absolute right-2 top-2 p-1.5 rounded-md bg-slate-800 text-slate-300 opacity-70 hover:opacity-100 transition-opacity"
            >
              {copied === 'curl' ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        )}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        <Inline text="Подставьте `{id колонки}` из метаданных таблицы. `WRITE`-ключи со значениями по умолчанию в JSON не пишутся; `$TOKEN` и `$XSRF` — как в справочнике API." />
      </p>
    </div>
  )
}

/** Список разделов и тем со ссылками на якоря. */
function Toc({ onPick }: { onPick?: () => void }) {
  return (
    <ol className="space-y-3">
      {TRIGGER_SECTIONS.map((section: TriggerSection) => (
        <li key={section.id}>
          <a href={`#${section.id}`} onClick={onPick} className="font-medium text-slate-700 dark:text-slate-200 hover:text-blue-500">{section.title}</a>
          <ul className="mt-1 space-y-1 pl-3 border-l border-slate-200 dark:border-slate-800">
            {section.topics.map((topic) => (
              <li key={topic.id}>
                <a href={`#${topic.id}`} onClick={onPick} className="text-slate-500 dark:text-slate-400 hover:text-blue-500">{topic.title}</a>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  )
}

/**
 * Триггеры кнопок — страница /triggers.html (python2node#866). Когда кнопка
 * выполняет промпт ИИ, формулу или запрос: события записи, запросы, формулы,
 * исполнитель, команды _d_action/_m_action и поведение сервера.
 * Текст — из src/data/triggerDocs.mjs, общего источника с пререндером
 * (scripts/prerender-triggers.mjs).
 */
export default function TriggerDocs() {
  const mobileToc = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    document.title = TRIGGER_META.title
    const canonical = `${SITE}${TRIGGER_META.path}`
    const ogImage = `${SITE}/og/triggers.png`

    const setMetaTag = (selector: string, attr: 'name' | 'property', key: string, content: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(selector)
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el) }
      el.setAttribute('content', content)
    }
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!link) { link = document.createElement('link'); link.setAttribute('rel', 'canonical'); document.head.appendChild(link) }
    link.setAttribute('href', canonical)

    setMetaTag('meta[name="description"]', 'name', 'description', TRIGGER_META.description)
    setMetaTag('meta[name="keywords"]', 'name', 'keywords', TRIGGER_META.keywords)
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', 'article')
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', TRIGGER_META.title)
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', TRIGGER_META.description)
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonical)
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', ogImage)
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'Интеграм')
    setMetaTag('meta[property="og:locale"]', 'property', 'og:locale', 'ru_RU')
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image')
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', TRIGGER_META.title)
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', TRIGGER_META.description)
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', ogImage)

    // Пререндер кладёт текст в #root, React рисует поверх — якорь из адреса
    // теряется, прокручиваем к нему сами.
    const hash = decodeURIComponent(window.location.hash.slice(1))
    if (hash) document.getElementById(hash)?.scrollIntoView()
  }, [])

  return (
    // overflow-x-clip, а не overflow-hidden: hidden на предке ломает sticky у содержания.
    <div className="overflow-x-clip">
      <section className="pt-28 pb-10 lg:pt-36 lg:pb-12 border-b border-slate-200 dark:border-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { name: 'Интеграм', to: '/' },
              { name: 'Триггеры', to: TRIGGER_META.path },
            ]}
          />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 text-blue-600 dark:text-blue-400 text-sm font-medium mb-5">
            <Hammer size={14} />
            Автоматизация
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-5">{TRIGGER_META.h1}</h1>
          <div className="space-y-3 max-w-4xl">
            {TRIGGER_INTRO.map((p, i) => (
              <p key={i} className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed"><Inline text={p} /></p>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 lg:py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
          {/* Телефон: свёрнутая полоса «Содержание» под шапкой (h-16), раскрывается списком. */}
          <details
            ref={mobileToc}
            className="lg:hidden sticky top-16 z-30 -mx-4 sm:-mx-6 mb-8 border-y border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md"
          >
            <summary className="px-4 sm:px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer select-none">
              Содержание
            </summary>
            <nav aria-label="Содержание" className="px-4 sm:px-6 pb-4 max-h-[calc(100vh-9rem)] overflow-y-auto text-sm">
              <Toc onPick={() => mobileToc.current?.removeAttribute('open')} />
            </nav>
          </details>

          {/* Десктоп: колонка слева прилипает под шапкой и прокручивается сама. */}
          <nav aria-label="Содержание" className="hidden lg:block">
            <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pb-6 text-sm">
              <div className="font-semibold text-slate-700 dark:text-slate-200 mb-3">Содержание</div>
              <Toc />
            </div>
          </nav>

          <div className="space-y-14 min-w-0">
            {TRIGGER_SECTIONS.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-32 lg:scroll-mt-24">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-6">{section.title}</h2>
                <div className="space-y-10">
                  {section.topics.map((topic) => (
                    <article key={topic.id} id={topic.id} className="scroll-mt-32 lg:scroll-mt-24 space-y-4">
                      <h3 className="text-xl font-semibold">{topic.title}</h3>
                      {topic.blocks.map((block, i) => <Block key={i} block={block} />)}
                      {/* Единственная интерактивная тема: сборщик JSON действия. */}
                      {topic.id === 'assemble' && <ActionBuilder />}
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
