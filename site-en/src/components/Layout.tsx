import { useEffect, useState, type ReactNode } from 'react'
import { Menu, X } from 'lucide-react'
import { Logo } from './Logo'
import { A, Container } from './ui'
import { CookieBanner } from './CookieBanner'
import { CONTACT_EMAIL, LOGIN_PATH, SIGNUP_PATH } from '../site'

const NAV = [
  { label: 'Excel to app', path: '/excel-to-app' },
  { label: 'AI agents', path: '/ai' },
  { label: 'Use cases', path: '/use-cases' },
  { label: 'Pricing', path: '/pricing' },
  { label: 'Knowledge base', path: '/knowledge-base' },
]

function isActive(current: string, path: string) {
  return current === path || current.startsWith(path + '/')
}

function Header({ path }: { path: string }) {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-4">
        <A to="/" aria-label="Integram home">
          <Logo />
        </A>
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <A
              key={item.path}
              to={item.path}
              aria-current={isActive(path, item.path) ? 'page' : undefined}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-100 hover:text-slate-900 ${
                isActive(path, item.path) ? 'text-blue-700' : 'text-slate-600'
              }`}
            >
              {item.label}
            </A>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <A to={LOGIN_PATH} className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
            Log in
          </A>
          <A
            to={SIGNUP_PATH}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Start free
          </A>
        </div>
        <button
          type="button"
          className="rounded-md p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </Container>
      {open && (
        <nav id="mobile-nav" aria-label="Main" className="border-t border-slate-200 bg-white lg:hidden">
          <Container className="flex flex-col py-3">
            {NAV.map((item) => (
              <A key={item.path} to={item.path} className="rounded-md px-2 py-3 font-medium text-slate-700 hover:bg-slate-50">
                {item.label}
              </A>
            ))}
            <A to="/contact" className="rounded-md px-2 py-3 font-medium text-slate-700 hover:bg-slate-50">
              Book a demo
            </A>
            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-200 pt-4">
              <A to={LOGIN_PATH} className="rounded-lg border border-slate-300 px-4 py-2.5 text-center font-semibold text-slate-800">
                Log in
              </A>
              <A to={SIGNUP_PATH} className="rounded-lg bg-blue-600 px-4 py-2.5 text-center font-semibold text-white">
                Start free
              </A>
            </div>
          </Container>
        </nav>
      )}
    </header>
  )
}

const FOOTER_COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Excel to web app', path: '/excel-to-app' },
      { label: 'AI agents, MCP and API', path: '/ai' },
      { label: 'Pricing', path: '/pricing' },
      { label: 'Use cases', path: '/use-cases' },
    ],
  },
  {
    title: 'Compare',
    links: [
      { label: 'Integram vs Airtable', path: '/compare/airtable' },
      { label: 'Integram vs Smartsheet', path: '/compare/smartsheet' },
      { label: 'Integram vs Notion', path: '/compare/notion' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Knowledge base', path: '/knowledge-base' },
      { label: 'Book a demo', path: '/contact' },
      { label: 'Log in', path: LOGIN_PATH },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of Service', path: '/terms' },
      { label: 'Privacy Policy', path: '/privacy' },
      { label: 'Cookie Policy', path: '/cookies' },
      { label: 'Data Processing Addendum', path: '/dpa' },
      { label: 'Sub-processors', path: '/subprocessors' },
      { label: 'Acceptable Use', path: '/acceptable-use' },
      { label: 'Copyright / DMCA', path: '/copyright' },
      { label: 'Security', path: '/security' },
    ],
  },
]

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-12">
      <Container>
        <div className="grid gap-10 md:grid-cols-[1.3fr_repeat(4,1fr)]">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-500">
              Turn spreadsheets into web apps with real relations, roles and an API your AI agents can use.
            </p>
            <a href={`mailto:${CONTACT_EMAIL}`} className="mt-4 inline-block text-sm font-medium text-blue-700 hover:underline">
              {CONTACT_EMAIL}
            </a>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-slate-900">{col.title}</p>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.path}>
                    <A to={l.path} className="text-sm text-slate-600 hover:text-blue-700">
                      {l.label}
                    </A>
                  </li>
                ))}
                {col.title === 'Legal' && (
                  <li>
                    <button
                      type="button"
                      className="text-left text-sm text-slate-600 hover:text-blue-700"
                      onClick={() => window.dispatchEvent(new Event('integram-open-consent'))}
                    >
                      Cookie settings
                    </button>
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-slate-200 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Integram. All rights reserved.</p>
        </div>
      </Container>
    </footer>
  )
}

export function Layout({ path, children }: { path: string; children: ReactNode }) {
  // The cookie banner depends on localStorage, which does not exist during
  // prerendering; mount it after hydration so server and client markup match.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:shadow"
      >
        Skip to content
      </a>
      <Header path={path} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
      {mounted && <CookieBanner />}
    </div>
  )
}
