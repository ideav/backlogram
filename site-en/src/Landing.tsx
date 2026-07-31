import {
  ArrowRight,
  Boxes,
  ClipboardList,
  FileSpreadsheet,
  LayoutTemplate,
  Mail,
  Network,
  ShieldCheck,
  Table2,
  Workflow,
} from 'lucide-react'
import { Logo } from './components/Logo'
import { ContactForm } from './components/ContactForm'

const PAINS = [
  {
    icon: FileSpreadsheet,
    title: 'Nobody knows which copy is current',
    body:
      'The file gets emailed, renamed, edited offline and merged by hand. Every number has to be double-checked before anyone dares to act on it.',
  },
  {
    icon: ShieldCheck,
    title: 'Everyone sees everything',
    body:
      'A spreadsheet has no roles. Salaries, margins and supplier prices sit one tab away from whoever needed the stock list.',
  },
  {
    icon: Network,
    title: 'The links live in your head',
    body:
      'Orders, items, suppliers and payments are related, but a sheet only knows rows. Keeping them consistent becomes somebody’s unpaid second job.',
  },
]

const STEPS = [
  {
    icon: Boxes,
    title: 'We model your objects',
    body:
      'Orders, customers, items, shipments — described as entities with real links between them, not as columns that happen to sit next to each other.',
  },
  {
    icon: Table2,
    title: 'Your data goes in',
    body:
      'Existing spreadsheets are loaded as they are. You navigate and edit them in a familiar table view, so nothing has to be retyped.',
  },
  {
    icon: Workflow,
    title: 'Rules and reports',
    body:
      'Selections, calculations and documents are defined as rules over the data — the monthly report stops being assembled by hand.',
  },
  {
    icon: LayoutTemplate,
    title: 'Screens for the people who use it',
    body:
      'Each role gets its own workplace: a warehouse keeper sees the receiving form, a manager sees the numbers. Same data, different views.',
  },
]

const BUILDS = [
  'Stock and inventory tracking',
  'Purchase requests and approvals',
  'Order and delivery pipelines',
  'Project and task registers',
  'Equipment and asset records',
  'Customer and supplier directories',
  'Production planning boards',
  'Internal document workflows',
]

export default function Landing() {
  return (
    <div className="bg-white text-slate-900">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="#top" aria-label="Integram — home">
            <Logo />
          </a>
          <a
            href="#contact"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Get in touch
          </a>
        </div>
      </header>

      <main id="top">
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-slate-200">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.10),transparent_60%)]"
          />
          <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
            <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                  <ClipboardList size={14} />
                  Custom internal software, built around your data
                </p>
                <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-[3.4rem]">
                  Your spreadsheet already runs the company.
                  <span className="block text-blue-600">Let it behave like an application.</span>
                </h1>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
                  Integram takes the files your team actually works in and turns them into one shared
                  system — with roles, forms, links between records and reports that build themselves.
                  You keep the way you work; you lose the copies, the merging and the guesswork.
                </p>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <a
                    href="#contact"
                    className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-7 py-3.5 font-semibold text-white transition-colors hover:bg-blue-700"
                  >
                    Tell us your task <ArrowRight size={18} />
                  </a>
                  <span className="text-sm text-slate-500">
                    We reply within one business day — no sign-up required.
                  </span>
                </div>
              </div>

              {/* Pure-CSS illustration: scattered files versus one shared record. */}
              <div className="relative">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Today
                  </p>
                  <div className="space-y-2">
                    {['stock_final.xlsx', 'stock_final_v2.xlsx', 'stock_final_v2_ANNA.xlsx'].map(
                      (file, i) => (
                        <div
                          key={file}
                          className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600"
                          style={{ marginLeft: `${i * 14}px` }}
                        >
                          <FileSpreadsheet size={16} className="shrink-0 text-slate-400" />
                          <span className="truncate">{file}</span>
                        </div>
                      ),
                    )}
                  </div>

                  <div className="my-5 flex items-center gap-3 text-slate-400">
                    <div className="h-px flex-1 bg-slate-200" />
                    <ArrowRight size={16} />
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>

                  <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-blue-600">
                    With Integram
                  </p>
                  <div className="rounded-xl border border-blue-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                      <Boxes size={18} className="text-blue-600" />
                      <span className="font-semibold">Stock — one shared record</span>
                    </div>
                    <div className="space-y-2.5 pt-3 text-sm">
                      {[
                        ['Warehouse keeper', 'receives and writes off'],
                        ['Buyer', 'sees what is running out'],
                        ['Director', 'sees the value, not the rows'],
                      ].map(([role, can]) => (
                        <div key={role} className="flex items-baseline justify-between gap-4">
                          <span className="font-medium text-slate-700">{role}</span>
                          <span className="text-right text-slate-500">{can}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Pains ────────────────────────────────────────────────────────── */}
        <section className="border-b border-slate-200 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
              A spreadsheet is a great start and a bad system of record
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-slate-600">
              It works until two people need it at once. After that, most of the effort goes into
              keeping the file honest rather than doing the work.
            </p>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {PAINS.map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-2xl border border-slate-200 p-7">
                  <Icon size={22} className="text-blue-600" />
                  <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                  <p className="mt-2.5 leading-relaxed text-slate-600">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────────────────── */}
        <section className="border-b border-slate-200 bg-slate-50 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
              How we build it with you
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-slate-600">
              Not a six-month project with a specification nobody reads. We put your real data into a
              working version early, then refine it while you use it.
            </p>
            <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {STEPS.map(({ icon: Icon, title, body }, i) => (
                <li key={title} className="rounded-2xl border border-slate-200 bg-white p-7">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold text-white">
                      {i + 1}
                    </span>
                    <Icon size={20} className="text-blue-600" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                  <p className="mt-2.5 leading-relaxed text-slate-600">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── What people build ────────────────────────────────────────────── */}
        <section className="border-b border-slate-200 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  What teams put into it
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-slate-600">
                  Anything that is currently a shared file plus a group chat. Operations, not
                  accounting: the everyday records that keep a business moving and that no off-the-shelf
                  product ever fits exactly.
                </p>
                <p className="mt-4 leading-relaxed text-slate-600">
                  If your process is unusual, that is the normal case here — the system is modelled
                  around your objects rather than around someone else’s idea of a workflow.
                </p>
              </div>
              <ul className="grid gap-3 sm:grid-cols-2">
                {BUILDS.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 px-5 py-4 text-slate-700"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── Honest limits ────────────────────────────────────────────────── */}
        <section className="border-b border-slate-200 py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="text-3xl font-bold tracking-tight">Where this is not the right tool</h2>
            <ul className="mt-8 space-y-4 text-lg leading-relaxed text-slate-600">
              <li>
                <span className="font-semibold text-slate-900">A public consumer product.</span>{' '}
                Integram builds internal systems for named users with roles, not high-traffic websites
                or mobile apps.
              </li>
              <li>
                <span className="font-semibold text-slate-900">A pixel-perfect brand experience.</span>{' '}
                Screens are clear and fast to change; they are not bespoke design work.
              </li>
              <li>
                <span className="font-semibold text-slate-900">One-off maths.</span> If the spreadsheet
                is a personal model that only you run once a quarter, keep the spreadsheet.
              </li>
            </ul>
          </div>
        </section>

        {/* ── Contact ──────────────────────────────────────────────────────── */}
        <section id="contact" className="scroll-mt-16 bg-slate-50 py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Tell us what should stop being a spreadsheet
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
                Describe the task in a few sentences. We will come back with what it would take, what
                it would look like, and whether we are the wrong people for it.
              </p>
            </div>
            <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
              <ContactForm />
            </div>
          </div>
        </section>

        {/* ── Privacy note ─────────────────────────────────────────────────── */}
        <section id="privacy" className="scroll-mt-16 border-t border-slate-200 py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="text-xl font-semibold">How we handle what you send</h2>
            <div className="mt-4 space-y-3 leading-relaxed text-slate-600">
              <p>
                The form collects your name, email, optional company name and the text of your message.
                We use them for one thing: to answer you and to discuss the task you described.
              </p>
              <p>
                We do not sell this data, do not add you to a mailing list, and do not pass it to
                advertising networks. The site sets no tracking cookies and runs no analytics scripts.
              </p>
              <p>
                Ask us to delete your enquiry at any time by writing to{' '}
                <a className="font-medium text-blue-600 hover:underline" href="mailto:abc@integram.io">
                  abc@integram.io
                </a>{' '}
                — we remove it and confirm.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 sm:px-6 md:flex-row md:items-center">
          <div>
            <Logo />
            <p className="mt-3 max-w-sm text-sm text-slate-500">
              Internal systems built around the data you already have.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <a
              href="mailto:abc@integram.io"
              className="inline-flex items-center gap-2 text-slate-600 transition-colors hover:text-blue-600"
            >
              <Mail size={15} /> abc@integram.io
            </a>
            <a href="#privacy" className="text-slate-600 transition-colors hover:text-blue-600">
              How we handle your data
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
