import React from 'react'
import { CheckCircle2, Paperclip, Send, X } from 'lucide-react'
import { reachGoal, leadSource, forgetLeadFrom } from '../lib/metrika'

/**
 * Форма заявки «Отправить на оценку» — одна на весь сайт (issue #827): стоит
 * в блоке #cta главной и на странице раздела «Автоматизация бизнеса», куда
 * ведёт реклама. Раньше жила внутри src/pages/Home.tsx, и раздел мог только
 * отправить посетителя на `/#cta` — лишний переход между объявлением и заявкой.
 *
 * `source` — раздел, из которого отправлена заявка (параметр цели `lead`,
 * #825). Без него — источник из sessionStorage (кнопка раздела, ведущая на
 * `/#cta`) или 'home'.
 */

declare global {
  interface Window {
    smartCaptcha?: {
      getResponse: (widgetId: number) => string
      reset: (widgetId: number) => void
      render: (container: HTMLElement | string, params: {
        sitekey: string
        callback?: (token: string) => void
        'error-callback'?: () => void
        'expired-callback'?: () => void
      }) => number
      destroy: (widgetId: number) => void
    }
  }
}

type FormState = 'idle' | 'sending' | 'success' | 'error'

const CAPTCHA_CLIENT_KEY = (import.meta.env.VITE_SMARTCAPTCHA_CLIENT_KEY as string | undefined) ?? ''

// Лимиты вложений формы (issue #399) — зеркалят серверные в telegram-notify.php:
// файлы улетают ботом прямо в Telegram-чат заявок (sendDocument, лимит API 50 МБ).
const ATTACH_MAX_FILES = 10
const ATTACH_MAX_BYTES = 10 * 1024 * 1024
const ATTACH_ACCEPT = '.xlsx,.xls,.csv,.ods,.doc,.docx,.pdf,.png,.jpg,.jpeg,.txt'

function formatBytes(n: number): string {
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} МБ`
  if (n >= 1024) return `${Math.round(n / 1024)} КБ`
  return `${n} Б`
}

function hasIdbCookie(): boolean {
  return document.cookie.split(';').some(c => c.trimStart().startsWith('idb_'))
}

export default function LeadForm({ source }: { source?: string }) {
  const [formState, setFormState] = React.useState<FormState>('idle')
  const [errorMsg, setErrorMsg]   = React.useState('')
  const [consentChecked, setConsentChecked] = React.useState(false)
  const [captchaToken, setCaptchaToken] = React.useState('')
  const [isCaptchaRequested, setIsCaptchaRequested] = React.useState(false)
  const [idbCookieFound] = React.useState(() => hasIdbCookie())
  const [attachedFiles, setAttachedFiles] = React.useState<File[]>([])
  const captchaContainerRef = React.useRef<HTMLDivElement>(null)
  const captchaWidgetIdRef = React.useRef<number | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  function addFiles(list: FileList | null) {
    if (!list || list.length === 0) return
    const next = [...attachedFiles]
    for (const f of Array.from(list)) {
      if (next.length >= ATTACH_MAX_FILES) {
        setErrorMsg(`Не больше ${ATTACH_MAX_FILES} файлов на заявку.`)
        setFormState('error')
        break
      }
      if (f.size > ATTACH_MAX_BYTES) {
        setErrorMsg(`«${f.name}» больше 10 МБ — приложите файл поменьше или пришлите его в Telegram.`)
        setFormState('error')
        continue
      }
      if (!next.some(x => x.name === f.name && x.size === f.size)) next.push(f)
    }
    setAttachedFiles(next)
    setIsCaptchaRequested(true)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  React.useEffect(() => {
    if (!CAPTCHA_CLIENT_KEY || !isCaptchaRequested || idbCookieFound) return

    function initCaptcha() {
      if (!captchaContainerRef.current || !window.smartCaptcha) return
      captchaWidgetIdRef.current = window.smartCaptcha.render(captchaContainerRef.current, {
        sitekey: CAPTCHA_CLIENT_KEY,
        callback: (token: string) => setCaptchaToken(token),
        'expired-callback': () => setCaptchaToken(''),
        'error-callback': () => setCaptchaToken(''),
      })
    }

    if (window.smartCaptcha) {
      initCaptcha()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://smartcaptcha.yandexcloud.net/captcha.js'
    script.defer = true
    script.onload = initCaptcha
    document.head.appendChild(script)

    return () => {
      if (captchaWidgetIdRef.current !== null && window.smartCaptcha) {
        window.smartCaptcha.destroy(captchaWidgetIdRef.current)
        captchaWidgetIdRef.current = null
      }
    }
  }, [isCaptchaRequested])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    // FormData вместо JSON (issue #399): бэкенд читает поля из $_POST, а
    // вложения из $_FILES и пересылает их ботом прямо в Telegram-чат заявок.
    const data = new FormData()
    data.set('name',    (form.elements.namedItem('name')    as HTMLInputElement).value)
    data.set('company', (form.elements.namedItem('company') as HTMLInputElement).value)
    data.set('contact', (form.elements.namedItem('contact') as HTMLInputElement).value)
    data.set('task',    (form.elements.namedItem('task')    as HTMLTextAreaElement).value)
    for (const f of attachedFiles) data.append('files[]', f, f.name)

    if (CAPTCHA_CLIENT_KEY && !idbCookieFound) {
      if (!captchaToken) {
        setErrorMsg('Пожалуйста, пройдите проверку капчи.')
        setFormState('error')
        return
      }
      data.set('captcha_token', captchaToken)
    }

    setFormState('sending')
    setErrorMsg('')

    try {
      const res = await fetch('/telegram-notify.php', {
        method: 'POST',
        body: data,
      })
      const json = await res.json()
      if (json.ok) {
        setFormState('success')
        // Заявку относим к разделу (#825): либо форма стоит в нём самом
        // (source), либо кнопка раздела привела на форму главной.
        reachGoal('lead', { source: source ?? leadSource('home') })
        forgetLeadFrom()
        form.reset()
        setAttachedFiles([])
        setCaptchaToken('')
        setIsCaptchaRequested(false)
        if (captchaWidgetIdRef.current !== null && window.smartCaptcha && captchaContainerRef.current) {
          window.smartCaptcha.reset(captchaWidgetIdRef.current)
        }
      } else {
        setFormState('error')
        setErrorMsg(json.error ?? 'Произошла ошибка. Попробуйте позже.')
        if (captchaWidgetIdRef.current !== null && window.smartCaptcha) {
          window.smartCaptcha.reset(captchaWidgetIdRef.current)
          setCaptchaToken('')
        }
      }
    } catch {
      setFormState('error')
      setErrorMsg('Не удалось отправить запрос. Проверьте соединение.')
    }
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-900/50 px-3 py-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 backdrop-blur-sm">
      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Окно ввода как в ИИ-чатах (issue #399): большое поле задачи,
            скрепка для вложений; файлы бот переслёт прямо в Telegram-чат заявок. */}
        <div>
          <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Задача</label>
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus-within:border-blue-500 transition-all overflow-hidden">
            <textarea
              name="task"
              rows={6}
              onInput={() => setIsCaptchaRequested(true)}
              className="w-full bg-transparent px-4 pt-3 pb-1 text-slate-800 dark:text-slate-100 outline-none resize-none block"
              placeholder="Опишите задачу своими словами: что учитываете, где сейчас живут данные, что должно получиться. Можно приложить Excel, ТЗ или скриншоты."
            />
            {attachedFiles.length > 0 && (
              <ul className="flex flex-wrap gap-2 px-3 pb-2">
                {attachedFiles.map((f, i) => (
                  <li key={`${f.name}-${f.size}`} className="flex items-center gap-2 max-w-full pl-3 pr-1.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300">
                    <Paperclip size={12} className="shrink-0 text-blue-500" />
                    <span className="truncate max-w-[11rem]" title={f.name}>{f.name}</span>
                    <span className="text-slate-400 dark:text-slate-500 shrink-0">{formatBytes(f.size)}</span>
                    <button
                      type="button"
                      aria-label={`Убрать файл ${f.name}`}
                      onClick={() => setAttachedFiles(attachedFiles.filter((_, j) => j !== i))}
                      className="shrink-0 rounded-full p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-900 px-2 py-1.5">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ATTACH_ACCEPT}
                className="hidden"
                onChange={e => addFiles(e.target.files)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm text-slate-500 dark:text-slate-400 hover:text-blue-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
              >
                <Paperclip size={16} />
                Прикрепить файлы
              </button>
              <span className="pr-2 text-[11px] text-slate-300 dark:text-slate-600">до {ATTACH_MAX_FILES} файлов, 10 МБ каждый</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Имя</label>
            <input name="name" type="text" className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 sm:py-3 text-slate-800 dark:text-slate-100 focus:border-blue-500 outline-none transition-all" placeholder="Александр" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Компания</label>
            <input name="company" type="text" className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 sm:py-3 text-slate-800 dark:text-slate-100 focus:border-blue-500 outline-none transition-all" placeholder="Digital Corp" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Email / Telegram</label>
          {/* required гасит submit-событие для пустого контакта, чтобы автоцель
              Метрики «Отправка формы» не засчитала пустую заявку (issue #467). */}
          <input name="contact" type="text" required onInvalid={e => { e.preventDefault(); setFormState('error'); setErrorMsg('Укажите контакт — email или Telegram, куда прислать оценку.') }} onInput={() => setIsCaptchaRequested(true)} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 sm:py-3 text-slate-800 dark:text-slate-100 focus:border-blue-500 outline-none transition-all" placeholder="@username" />
        </div>

        {formState === 'success' && (
          <div className="flex items-center gap-2 text-green-500 dark:text-green-400 text-sm font-medium">
            <CheckCircle2 size={16} />
            Заявка отправлена! Мы свяжемся с вами в течение 24 часов.
          </div>
        )}
        {formState === 'error' && (
          <div className="text-red-500 dark:text-red-400 text-sm font-medium">{errorMsg}</div>
        )}

        {CAPTCHA_CLIENT_KEY && !idbCookieFound && isCaptchaRequested && (
          <div ref={captchaContainerRef} />
        )}

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={consentChecked}
            onChange={e => setConsentChecked(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 dark:border-slate-600 accent-blue-600 cursor-pointer"
          />
          <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Я даю согласие на{' '}
            <a
              href="/privacy.html"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-500 transition-colors"
            >
              обработку персональных данных
            </a>
          </span>
        </label>
        <button
          type="submit"
          disabled={formState === 'sending' || formState === 'success' || !consentChecked}
          className="w-full py-3 sm:py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
        >
          {formState === 'sending' ? 'Отправка...' : 'Отправить на оценку'}
          {formState !== 'sending' && <Send size={18} />}
        </button>
      </form>
    </div>
  )
}
