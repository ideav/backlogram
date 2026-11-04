import './style.css'

// Живая часть finmo.integram.io: отправка форм в /order.php, цель Метрики, плашка cookies.
// Страницы целиком отрисованы на сборке, этот файл их только оживляет.

const METRIKA_ID = 104176620
const COOKIE_KEY = 'finmo-cookies-ok'

type YmFn = (id: number, action: string, goal?: string) => void

function reachGoal(goal: string): void {
  try {
    const ym = (window as unknown as { ym?: YmFn }).ym
    if (typeof ym === 'function') ym(METRIKA_ID, 'reachGoal', goal)
  } catch {
    // Метрика — не повод ломать отправку заявки.
  }
}

/** utm_* и yclid из адреса — одной строкой для оператора. */
function utmString(): string {
  try {
    const params = new URLSearchParams(location.search)
    const parts: string[] = []
    params.forEach((value, key) => {
      if (/^(utm_|yclid$|gclid$)/.test(key)) parts.push(`${key}=${value}`)
    })
    return parts.join('&').slice(0, 500)
  } catch {
    return ''
  }
}

function setMessage(form: HTMLFormElement, text: string, error: boolean): void {
  const box = form.querySelector<HTMLElement>('.lead__msg')
  if (!box) return
  box.textContent = text
  box.dataset.state = error ? 'error' : 'ok'
}

function initForm(form: HTMLFormElement): void {
  form.addEventListener('submit', async event => {
    event.preventDefault()
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]')
    const data = new FormData(form)
    const payload: Record<string, string> = {}
    data.forEach((value, key) => {
      if (typeof value === 'string') payload[key] = value.trim()
    })

    const email = payload.email ?? ''
    const phone = payload.phone ?? ''
    if (email === '' && phone === '') {
      setMessage(form, 'Укажите телефон или почту, чтобы мы могли ответить.', true)
      return
    }
    if (email !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage(form, 'Проверьте адрес почты.', true)
      return
    }

    payload.page = location.pathname
    payload.utm = utmString()
    setMessage(form, 'Отправляем…', false)
    if (button) button.disabled = true

    try {
      const response = await fetch('/order.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null
      if (response.ok && result?.ok) {
        reachGoal('lead')
        // Небольшая пауза, чтобы цель успела уйти до смены страницы.
        setTimeout(() => {
          location.href = '/success'
        }, 250)
        return
      }
      setMessage(form, result?.error ?? 'Не удалось отправить. Попробуйте ещё раз или позвоните нам.', true)
    } catch {
      setMessage(form, 'Нет связи с сервером. Попробуйте ещё раз или позвоните нам.', true)
    }
    if (button) button.disabled = false
  })
}

function initCookieBar(): void {
  const bar = document.getElementById('cookie-bar')
  const ok = document.getElementById('cookie-ok')
  if (!bar || !ok) return
  let accepted = false
  try {
    accepted = localStorage.getItem(COOKIE_KEY) === '1'
  } catch {
    accepted = false
  }
  if (!accepted) bar.hidden = false
  ok.addEventListener('click', () => {
    bar.hidden = true
    try {
      localStorage.setItem(COOKIE_KEY, '1')
    } catch {
      // Приватный режим: плашка просто покажется снова.
    }
  })
}

document.querySelectorAll<HTMLFormElement>('form[data-form]').forEach(initForm)
initCookieBar()
