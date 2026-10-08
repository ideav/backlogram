import { useEffect, useState } from 'react'
import { ANALYTICS_ENABLED, gpcEnabled, readConsent, writeConsent } from '../lib/analytics'
import { A } from './ui'

/**
 * Opt-in consent banner (issue #531). Analytics stays unloaded until the
 * visitor presses "Accept analytics"; "Decline" is equally prominent, and the
 * choice can be changed later from the footer ("Cookie settings") or the
 * Cookie Policy page. Strictly necessary storage (the choice itself) does not
 * need consent.
 *
 * Global Privacy Control: a browser sending GPC has declined analytics. The
 * banner never opens by itself; reopened from "Cookie settings", it explains
 * that analytics stays off and offers no "Accept" button.
 */
export function CookieBanner() {
  const [open, setOpen] = useState(false)
  const gpc = gpcEnabled()

  useEffect(() => {
    if (ANALYTICS_ENABLED && !gpcEnabled() && readConsent() === null) setOpen(true)
    const reopen = () => setOpen(true)
    window.addEventListener('integram-open-consent', reopen)
    return () => window.removeEventListener('integram-open-consent', reopen)
  }, [])

  if (!open) return null

  const choose = (value: 'granted' | 'denied') => {
    writeConsent(value)
    setOpen(false)
  }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="consent-title"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white p-4 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] sm:inset-x-auto sm:bottom-4 sm:right-4 sm:max-w-md sm:rounded-2xl sm:border"
    >
      <p id="consent-title" className="font-semibold text-slate-900">
        {gpc ? 'Analytics is off' : 'Can we count your visit?'}
      </p>
      {gpc ? (
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Your browser sends a Global Privacy Control signal, so we treat it as declining analytics and never load it.
          We only use the storage needed for the site to work. Details in our{' '}
          <A to="/cookies" className="font-medium text-blue-700 underline">
            Cookie Policy
          </A>
          .
        </p>
      ) : (
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          With your permission we use privacy-friendly analytics (Plausible) to see which pages help people. No
          advertising trackers, no cross-site profiles. Details in our{' '}
          <A to="/cookies" className="font-medium text-blue-700 underline">
            Cookie Policy
          </A>
          .
        </p>
      )}
      {gpc ? (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            OK
          </button>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => choose('denied')}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => choose('granted')}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Accept analytics
          </button>
        </div>
      )}
    </div>
  )
}
