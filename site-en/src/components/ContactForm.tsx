import { useState } from 'react'

type FormState = 'idle' | 'sending' | 'success' | 'error'

// The endpoint sits next to the page, so it follows the deployment base: at the
// web root that is `/order.php`, under a language subfolder `/en/order.php`.
const ENDPOINT = `${import.meta.env.BASE_URL}order.php`

/**
 * The only conversion point on the site. There is no sign-up and no login: a
 * visitor can ask us to get in touch, nothing else (issue #524). The form posts
 * to `order.php`, which lives in `site-en/public/`.
 */
export function ContactForm() {
  const [state, setState] = useState<FormState>('idle')
  const [error, setError] = useState('')
  const [consent, setConsent] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const payload = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      company: (form.elements.namedItem('company') as HTMLInputElement).value,
      task: (form.elements.namedItem('task') as HTMLTextAreaElement).value,
      // Honeypot: bots fill every field they see, people never see this one.
      website: (form.elements.namedItem('website') as HTMLInputElement).value,
    }

    setState('sending')
    setError('')

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.ok) {
        setState('success')
        form.reset()
        setConsent(false)
      } else {
        setState('error')
        setError(json.error ?? 'Something went wrong. Please try again.')
      }
    } catch {
      setState('error')
      setError('Could not reach the server. Please check your connection and try again.')
    }
  }

  if (state === 'success') {
    return (
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-8 text-center">
        <h3 className="text-xl font-semibold text-slate-900">Thank you — the request is in.</h3>
        <p className="mt-3 text-slate-600">
          We read every message ourselves and normally reply within one business day. If it is
          urgent, write to{' '}
          <a className="font-medium text-blue-600 hover:underline" href="mailto:abc@integram.io">
            abc@integram.io
          </a>
          .
        </p>
      </div>
    )
  }

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700">
            Your name
          </label>
          <input id="name" name="name" type="text" required autoComplete="name" className={inputClass} />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@company.com"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="company" className="mb-1.5 block text-sm font-medium text-slate-700">
          Company <span className="font-normal text-slate-400">— optional</span>
        </label>
        <input id="company" name="company" type="text" autoComplete="organization" className={inputClass} />
      </div>

      <div>
        <label htmlFor="task" className="mb-1.5 block text-sm font-medium text-slate-700">
          What are you trying to get out of a spreadsheet?
        </label>
        <textarea
          id="task"
          name="task"
          rows={5}
          required
          placeholder="For example: five people edit the same stock file, nobody knows which copy is current, and the monthly report is assembled by hand."
          className={inputClass}
        />
      </div>

      {/* Honeypot — hidden from people, tempting to bots. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <label className="flex items-start gap-3 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          required
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        <span>
          I agree that Integram may store what I send here in order to reply. See{' '}
          <a href="#privacy" className="font-medium text-blue-600 hover:underline">
            how we handle it
          </a>
          .
        </span>
      </label>

      {state === 'error' && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <button
        type="submit"
        disabled={state === 'sending' || !consent}
        className="w-full rounded-lg bg-blue-600 px-6 py-3.5 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {state === 'sending' ? 'Sending…' : 'Ask us to get in touch'}
      </button>

      <p className="text-center text-xs text-slate-400">
        No account, no credit card, no automated sales sequence — a person reads it and answers.
      </p>
    </form>
  )
}
