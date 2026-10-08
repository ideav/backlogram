import { useEffect, useState, type ReactNode } from 'react'
import { ArrowRight, ChevronDown, X, ZoomIn } from 'lucide-react'
import { href, SIGNUP_UPLOAD_PATH } from '../site'
import { getImageAlt } from '../content/imageAlt'

/** Internal link that respects the deployment base. Plain <a>: every page is a prerendered file. */
export function A({
  to,
  children,
  className,
  ...rest
}: { to: string; children: ReactNode; className?: string } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  const external = /^https?:/.test(to)
  return (
    <a
      href={href(to)}
      className={className}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...rest}
    >
      {children}
    </a>
  )
}

export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className}`}>{children}</div>
}

export function Section({
  children,
  className = '',
  id,
  muted,
}: {
  children: ReactNode
  className?: string
  id?: string
  muted?: boolean
}) {
  return (
    <section id={id} className={`scroll-mt-20 py-16 sm:py-20 ${muted ? 'bg-slate-50' : ''} ${className}`}>
      <Container>{children}</Container>
    </section>
  )
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-700">{children}</p>
}

export function H2({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h2 className={`text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl ${className}`}>{children}</h2>
}

export function Lead({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`mt-4 text-lg leading-relaxed text-slate-600 ${className}`}>{children}</p>
}

const btnBase =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-6 py-3 font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'

export function Button({
  to,
  children,
  variant = 'primary',
  arrow,
  className = '',
}: {
  to: string
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  arrow?: boolean
  className?: string
}) {
  const styles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'border border-slate-300 bg-white text-slate-900 hover:border-slate-400 hover:bg-slate-50',
    ghost: 'text-blue-700 hover:bg-blue-50',
  }[variant]
  return (
    <A to={to} className={`${btnBase} ${styles} ${className}`}>
      {children}
      {arrow && <ArrowRight size={18} aria-hidden="true" />}
    </A>
  )
}

export function Faq({ items, title = 'Frequently asked questions' }: { items: { q: string; a: string }[]; title?: string }) {
  return (
    <div className="mx-auto max-w-3xl">
      <H2 className="text-center">{title}</H2>
      <div className="mt-10 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
        {items.map((item) => (
          <details key={item.q} className="group px-6 py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
              {item.q}
              <ChevronDown size={18} aria-hidden="true" className="shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-3 leading-relaxed text-slate-600">{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  )
}

export function CtaBand({
  title = 'Your spreadsheet, working as an app, today',
  text = 'Start free with your own file. No credit card, no sales call. If you would rather have us build it, book a demo.',
  to = SIGNUP_UPLOAD_PATH,
}: {
  title?: string
  text?: string
  to?: string
}) {
  return (
    <section className="bg-slate-900 py-16 text-white sm:py-20">
      <Container className="text-center">
        <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">{text}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button to={to} arrow>
            Start free
          </Button>
          <A
            to="/contact"
            className={`${btnBase} border border-slate-600 text-white hover:border-slate-400 hover:bg-slate-800`}
          >
            Book a demo
          </A>
        </div>
      </Container>
    </section>
  )
}

export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-500">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <li key={item.path} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden="true">/</span>}
            {i < items.length - 1 ? (
              <A to={item.path} className="hover:text-blue-700 hover:underline">
                {item.name}
              </A>
            ) : (
              <span aria-current="page" className="text-slate-700">
                {item.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

/**
 * Click-to-enlarge wrapper: a link to the full image (works without JS) that opens
 * a lightbox instead. Must not sit inside another <a>.
 */
export function Zoomable({
  src,
  alt,
  children,
  className = '',
}: {
  src: string
  alt: string
  children: ReactNode
  className?: string
}) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <>
      <a
        href={href(src)}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
          e.preventDefault()
          setOpen(true)
        }}
        aria-label={alt ? `Enlarge image: ${alt}` : 'Enlarge image'}
        className={`group/zoom relative block cursor-zoom-in ${className}`}
      >
        {children}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/60 text-white opacity-0 transition-opacity group-hover/zoom:opacity-100 group-focus-visible/zoom:opacity-100"
        >
          <ZoomIn size={18} />
        </span>
      </a>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt || 'Image'}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[60] flex cursor-zoom-out items-center justify-center bg-slate-950/85 p-4 sm:p-8"
        >
          <img src={href(src)} alt={alt} className="max-h-full max-w-full rounded-xl object-contain shadow-2xl" />
          <button
            type="button"
            autoFocus
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X size={22} />
          </button>
        </div>
      )}
    </>
  )
}

/** Image from the images stream; lazy by default, explicit size to avoid layout shift. Click enlarges it. */
export function Img({
  src,
  alt,
  width = 1536,
  height = 1024,
  eager,
  className = '',
}: {
  src: string
  alt?: string
  width?: number
  height?: number
  eager?: boolean
  className?: string
}) {
  const text = alt ?? getImageAlt(src)
  return (
    <Zoomable src={src} alt={text}>
      <img
        src={href(src)}
        alt={text}
        width={width}
        height={height}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        {...(eager ? { fetchpriority: 'high' } : {})}
        className={`h-auto w-full rounded-2xl border border-slate-200 bg-slate-100 object-cover ${className}`}
      />
    </Zoomable>
  )
}
