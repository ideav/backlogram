import {
  ArrowRight,
  Bot,
  Check,
  Code2,
  FileSpreadsheet,
  GitBranch,
  KeyRound,
  Network,
  Server,
  ShieldCheck,
  Table2,
  Upload,
  Users,
  BarChart3,
  Minus,
} from 'lucide-react'
import { A, Button, Container, CtaBand, Eyebrow, Faq, H2, Img, Lead, Section } from '../components/ui'
import { PricingCards } from '../components/PricingCards'
import { useCases } from '../content/usecases'
import { HOME_FAQ } from '../data/faq'
import { SIGNUP_PATH } from '../site'

const PAINS = [
  {
    icon: FileSpreadsheet,
    title: 'Nobody knows which copy is current',
    body: 'The file is emailed, renamed and merged by hand. Every number gets double-checked before anyone dares to act on it.',
  },
  {
    icon: ShieldCheck,
    title: 'Everyone sees everything',
    body: 'A spreadsheet has no roles. Salaries, margins and client lists sit one tab away from whoever needed the stock count.',
  },
  {
    icon: Network,
    title: 'Relations live in somebody’s head',
    body: 'Orders, customers, products and payments are connected, but a sheet only knows rows. Keeping them in sync becomes an unpaid second job.',
  },
]

const STEPS = [
  {
    icon: Upload,
    title: 'Upload your spreadsheet',
    body: 'Drop in an .xlsx file. Integram finds the tables, the column types and the columns that point to other sheets.',
  },
  {
    icon: GitBranch,
    title: 'Check the structure',
    body: 'Repeated names become links between tables, so each customer or product exists once. Adjust anything before you confirm.',
  },
  {
    icon: Users,
    title: 'Invite the team',
    body: 'Give each role its own view: who can see which tables, columns and rows. Forms, filters and reports work from day one.',
  },
  {
    icon: Bot,
    title: 'Let AI take it further',
    body: 'Connect Claude or another agent through MCP and ask for a new table, a report or a cleanup. It works inside the rules you set.',
  },
]

const FEATURES = [
  { icon: Table2, title: 'Real relational data', body: 'Tables that reference each other, lookups across links, and nested or recursive queries for reports a spreadsheet cannot do.' },
  { icon: ShieldCheck, title: 'Access down to the row', body: 'Roles control tables, columns and individual records. A rep sees their own deals; finance sees the margins.' },
  { icon: BarChart3, title: 'Forms, reports, dashboards', body: 'Data-entry forms for the people who add records, live reports for the people who read them, scheduled emails for the rest.' },
  { icon: Code2, title: 'Full REST API', body: 'Schema, records, users, roles and access rules are all available over HTTP with a token. Screens are plain HTML, CSS and JS.' },
  { icon: Server, title: 'Cloud or self-hosted', body: 'Start in the cloud. Move to a Docker container on your own servers, even without internet access, when you need to.' },
  { icon: KeyRound, title: 'Sign in your way', body: 'Email, Google or GitHub to get started. SSO and LDAP / Active Directory for larger teams.' },
]

type Mark = 'yes' | 'no' | 'partial'
const TEASER: { label: string; cells: [Mark, Mark, Mark, Mark] }[] = [
  { label: 'Flat price, not per seat', cells: ['yes', 'no', 'no', 'no'] },
  { label: 'Row-level access rules', cells: ['yes', 'partial', 'partial', 'partial'] },
  { label: 'Self-hosting', cells: ['yes', 'no', 'no', 'no'] },
  { label: 'Excel import with links detected', cells: ['yes', 'no', 'no', 'no'] },
  { label: 'Large template ecosystem', cells: ['no', 'yes', 'yes', 'yes'] },
]

function MarkIcon({ m }: { m: Mark }) {
  if (m === 'yes') return <Check size={18} className="mx-auto text-blue-600" aria-label="Yes" />
  if (m === 'partial') return <span className="text-sm text-slate-500">Partly</span>
  return <Minus size={18} className="mx-auto text-slate-300" aria-label="No" />
}

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.12),transparent_60%)]"
        />
        <Container className="relative grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800">
              <Bot size={15} aria-hidden="true" /> Spreadsheet to web app, with an API your AI agents can use
            </p>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.5rem]">
              Your spreadsheet, rebuilt as a real app.
              <span className="block text-blue-600">Your AI agent, ready to run it.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
              Upload an Excel file and get a web app with linked tables, forms, roles and reports. Then connect
              Claude or any MCP-compatible agent and change the app by asking, not by clicking through settings.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button to={SIGNUP_PATH} arrow>
                Start free
              </Button>
              <Button to="/contact" variant="secondary">
                Book a demo
              </Button>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              Free plan forever. No credit card. Sign up with email, Google or GitHub.
            </p>
          </div>
          <Img
            src="/img/hero.png"
            eager
          />
        </Container>
      </section>

      {/* Two audiences */}
      <Section>
        <div className="grid gap-6 md:grid-cols-2">
          <A
            to="/ai"
            className="group rounded-2xl border border-slate-200 p-7 transition-colors hover:border-blue-300 hover:bg-blue-50/40"
          >
            <Bot size={24} className="text-blue-600" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-semibold text-slate-900">You build tools with AI agents</h2>
            <p className="mt-2 leading-relaxed text-slate-600">
              Give your agent a real backend instead of a pile of JSON files: tables, relations, users and permissions it
              can create and query through MCP or REST, with a UI your colleagues can use the same day.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 font-semibold text-blue-700">
              Connect your agent <ArrowRight size={16} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </A>
          <A
            to="/excel-to-app"
            className="group rounded-2xl border border-slate-200 p-7 transition-colors hover:border-blue-300 hover:bg-blue-50/40"
          >
            <FileSpreadsheet size={24} className="text-blue-600" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-semibold text-slate-900">Your business runs on spreadsheets</h2>
            <p className="mt-2 leading-relaxed text-slate-600">
              Keep the data and the way you work, lose the copies and the hand-made reports. One shared system where each
              person sees what they need, without hiring developers or paying per seat.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 font-semibold text-blue-700">
              Turn Excel into an app <ArrowRight size={16} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </A>
        </div>
      </Section>

      {/* Pains */}
      <Section muted>
        <div className="max-w-2xl">
          <Eyebrow>The problem</Eyebrow>
          <H2>A spreadsheet is a great start and a bad system of record</H2>
          <Lead>It works until two people need it at once. After that, most of the effort goes into keeping the file honest instead of doing the work.</Lead>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PAINS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-7">
              <Icon size={22} className="text-blue-600" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-2.5 leading-relaxed text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* How it works */}
      <Section id="how-it-works">
        <div className="max-w-2xl">
          <Eyebrow>How it works</Eyebrow>
          <H2>From file to working app before lunch</H2>
          <Lead>No specification, no six-month project. You start from the data you already have and improve the app while people use it.</Lead>
        </div>
        <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="rounded-2xl border border-slate-200 p-7">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold text-white">{i + 1}</span>
                <Icon size={20} className="text-blue-600" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-2.5 leading-relaxed text-slate-600">{body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* AI angle */}
      <section className="bg-slate-900 py-16 text-white sm:py-20">
        <Container className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-300">Built for AI agents</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ask for the app you need. Your agent builds it in Integram.</h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-300">
              Integram exposes the whole platform, not just the data, through an MCP server and a REST API. An agent can
              design tables, link them, load records, set up roles and query the result. People then use the same app in
              the browser.
            </p>
            <ul className="mt-6 space-y-3 text-slate-200">
              {[
                'Works with Claude Desktop, Claude Code, Cursor and other MCP clients',
                'Agents act with the permissions of their account, nothing more',
                'Every change, by a person or an agent, is written to the audit log',
                'Prefer your own model? Self-host and keep the data on your servers',
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <Check size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-blue-400" />
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Button to="/ai" arrow>
                See how agents connect
              </Button>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-950 p-6 font-mono text-sm leading-relaxed shadow-2xl">
            <p className="text-slate-500"># You, in Claude:</p>
            <p className="mt-1 text-slate-100">
              Create a client portal from clients.xlsx. Each client should only see their own projects and invoices.
            </p>
            <p className="mt-5 text-slate-500"># The agent, through the Integram MCP server:</p>
            <ul className="mt-1 space-y-1 text-blue-300">
              <li>✓ created tables Clients, Projects, Invoices</li>
              <li>✓ linked Projects → Clients, Invoices → Projects</li>
              <li>✓ imported 214 clients, 631 projects</li>
              <li>✓ added role “Client” with row filter: own records</li>
            </ul>
            <p className="mt-5 text-slate-500"># Done. Invite your first client.</p>
          </div>
        </Container>
      </section>

      {/* Features */}
      <Section>
        <div className="max-w-2xl">
          <Eyebrow>What you get</Eyebrow>
          <H2>Everything a business app needs, nothing to code</H2>
        </div>
        <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title}>
              <Icon size={22} className="text-blue-600" aria-hidden="true" />
              <h3 className="mt-3 text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 leading-relaxed text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Use cases */}
      <Section muted>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <Eyebrow>Use cases</Eyebrow>
            <H2>What teams build with Integram</H2>
          </div>
          <A to="/use-cases" className="inline-flex items-center gap-1.5 font-semibold text-blue-700 hover:underline">
            All use cases <ArrowRight size={16} aria-hidden="true" />
          </A>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {useCases.slice(0, 6).map((uc) => (
            <A
              key={uc.slug}
              to={`/use-cases/${uc.slug}`}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow hover:shadow-md"
            >
              <img
                src={`${import.meta.env.BASE_URL}${uc.image.replace(/^\//, '')}`}
                alt=""
                width={1536}
                height={1024}
                loading="lazy"
                decoding="async"
                className="aspect-[3/2] w-full bg-slate-100 object-cover"
              />
              <div className="p-6">
                <h3 className="font-semibold text-slate-900 group-hover:text-blue-700">{uc.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{uc.subheadline}</p>
              </div>
            </A>
          ))}
        </div>
      </Section>

      {/* Comparison teaser */}
      <Section>
        <div className="max-w-2xl">
          <Eyebrow>Compared honestly</Eyebrow>
          <H2>Where Integram fits next to the tools you know</H2>
          <Lead>Airtable, Smartsheet and Notion are excellent products. Here is where Integram is different, and where it is not.</Lead>
        </div>
        <div className="mt-10 overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full min-w-[640px] text-left">
            <thead className="bg-slate-50 text-sm">
              <tr>
                <th scope="col" className="px-5 py-4 font-semibold text-slate-700">
                  <span className="sr-only">Capability</span>
                </th>
                {['Integram', 'Airtable', 'Smartsheet', 'Notion'].map((n) => (
                  <th key={n} scope="col" className={`px-5 py-4 text-center font-semibold ${n === 'Integram' ? 'text-blue-700' : 'text-slate-700'}`}>
                    {n}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {TEASER.map((row) => (
                <tr key={row.label}>
                  <th scope="row" className="px-5 py-4 font-medium text-slate-800">{row.label}</th>
                  {row.cells.map((m, i) => (
                    <td key={i} className="px-5 py-4 text-center">
                      <MarkIcon m={m} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
          <A to="/compare/airtable" className="text-blue-700 hover:underline">Integram vs Airtable</A>
          <A to="/compare/smartsheet" className="text-blue-700 hover:underline">Integram vs Smartsheet</A>
          <A to="/compare/notion" className="text-blue-700 hover:underline">Integram vs Notion</A>
        </div>
      </Section>

      {/* Pricing teaser */}
      <Section muted>
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Pricing</Eyebrow>
          <H2>A flat price for the whole team</H2>
          <Lead>Pay for how much the app is used, not for how many people log in. Start free and stay free as long as it fits.</Lead>
        </div>
        <div className="mt-12">
          <PricingCards compact />
        </div>
        <p className="mt-8 text-center">
          <A to="/pricing" className="inline-flex items-center gap-1.5 font-semibold text-blue-700 hover:underline">
            Compare plans and see what an action is <ArrowRight size={16} aria-hidden="true" />
          </A>
        </p>
      </Section>

      <Section>
        <Faq items={HOME_FAQ} />
      </Section>

      <CtaBand />
    </>
  )
}
