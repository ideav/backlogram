import { Check, Database, Eye, History, Layers, Lock, MessageSquare, Server, Users } from 'lucide-react'
import { Button, Container, CtaBand, Eyebrow, Faq, H2, Img, Lead, Section } from '../components/ui'
import { AI_FAQ } from '../data/faq'
import { SIGNUP_PATH } from '../site'

const CAN_DO = [
  'Design tables and fields from a plain-language description',
  'Link tables to each other and build lookups across them',
  'Load records from a file, a website or another system',
  'Create users and roles, and set who sees which rows',
  'Query the data and build reports',
  'Clean up duplicates and fix inconsistent values in bulk',
]

const PROMPTS = [
  'Build a CRM from leads.xlsx: companies, contacts, deals. Sales reps see only their own deals.',
  'Add a “Renewal date” field to Contracts and give me a report of everything renewing in the next 60 days.',
  'Find customers that appear twice under slightly different names and merge them.',
  'Create a read-only role for our accountant with access to Invoices and Payments only.',
  'Import this week’s orders from the attached CSV and link each one to the right customer.',
]

const WHY = [
  { icon: Database, title: 'A real database, not a JSON file', text: 'Relations, types and queries that hold up when the tool grows past a demo.' },
  { icon: Users, title: 'A UI for everyone else', text: 'Colleagues who never open an AI chat use the same app in the browser: tables, forms and reports.' },
  { icon: Lock, title: 'Permissions that bind the agent', text: 'The agent is a user with a role. It cannot read or change what that role cannot.' },
  { icon: History, title: 'Every change on record', text: 'Edits by people and agents land in the same audit log, so you can see who did what.' },
  { icon: Layers, title: 'Schema changes are safe', text: 'Integram stores structure as data. A new table or field from an agent does not require a migration or downtime.' },
  { icon: Server, title: 'Your data, your servers', text: 'Self-host Integram and pair it with a local model when the data must not leave your network.' },
]

const MCP_CONFIG = `{
  "mcpServers": {
    "integram": {
      "command": "npx",
      "args": ["-y", "integram-mcp"]
    }
  }
}`

export default function Ai() {
  return (
    <>
      <section className="border-b border-slate-200">
        <Container className="grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <Eyebrow>For AI builders</Eyebrow>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              Give your AI agent a real backend
            </h1>
            <Lead>
              Connect Claude, ChatGPT or your own agent to Integram through MCP or the REST API. The agent builds and runs
              business apps with tables, relations, users and permissions, and your team uses them in the browser.
            </Lead>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button to={SIGNUP_PATH} arrow>
                Start free
              </Button>
              <Button to="#connect" variant="secondary">
                How to connect
              </Button>
            </div>
            <p className="mt-4 text-sm text-slate-500">API and MCP access are included in every plan, free included.</p>
          </div>
          <Img src="/img/ai-mcp.png" eager />
        </Container>
      </section>

      <Section>
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <Eyebrow>What an agent can do</Eyebrow>
            <H2>The whole platform, not just a read-only data feed</H2>
            <Lead>
              Most tools give an agent a narrow window: read some rows, maybe write one. Integram exposes the same
              operations you have in the interface, from schema design to access rules.
            </Lead>
          </div>
          <ul className="space-y-3">
            {CAN_DO.map((t) => (
              <li key={t} className="flex gap-3 rounded-xl border border-slate-200 p-4 text-slate-700">
                <Check size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-blue-600" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section muted id="connect">
        <div className="max-w-2xl">
          <Eyebrow>Connect in three steps</Eyebrow>
          <H2>From sign-up to your first agent-built table</H2>
        </div>
        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          <ol className="space-y-6">
            <li className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="font-semibold text-slate-900">1. Create a workspace and an agent user</h3>
              <p className="mt-2 leading-relaxed text-slate-600">
                Sign up free. Add a separate user for the agent and give it a role, for example full rights in a sandbox
                workspace or read-only access to production tables.
              </p>
            </li>
            <li className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="font-semibold text-slate-900">2. Add the Integram MCP server to your client</h3>
              <p className="mt-2 leading-relaxed text-slate-600">
                In Claude Desktop, Claude Code, Cursor or any MCP client, add the <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">integram-mcp</code>{' '}
                server from npm. Its README lists the settings for your workspace address and the agent’s credentials.
              </p>
            </li>
            <li className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="font-semibold text-slate-900">3. Ask</h3>
              <p className="mt-2 leading-relaxed text-slate-600">
                Describe the app you need. The agent creates the tables and links, and you open the result in the
                browser to check it.
              </p>
            </li>
          </ol>
          <div className="space-y-6">
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
              <p className="border-b border-slate-800 px-5 py-3 font-mono text-xs text-slate-400">MCP client configuration</p>
              <pre className="overflow-x-auto p-5 text-sm leading-relaxed text-slate-100">
                <code>{MCP_CONFIG}</code>
              </pre>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="font-semibold text-slate-900">Not using MCP? Use the REST API</h3>
              <p className="mt-2 leading-relaxed text-slate-600">
                Every operation is available over HTTP with a token: tables, fields, links, records, users, roles and
                access rules. That covers ChatGPT custom actions, n8n or Zapier HTTP steps, LangChain or LlamaIndex tools,
                and your own scripts.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <div className="max-w-2xl">
          <Eyebrow>Try asking</Eyebrow>
          <H2>Things people ask their agent to do in Integram</H2>
        </div>
        <ul className="mt-10 grid gap-4 md:grid-cols-2">
          {PROMPTS.map((p) => (
            <li key={p} className="flex gap-3 rounded-2xl border border-slate-200 p-5">
              <MessageSquare size={18} aria-hidden="true" className="mt-1 shrink-0 text-blue-600" />
              <p className="leading-relaxed text-slate-700">{p}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section muted>
        <div className="max-w-2xl">
          <Eyebrow>Why Integram as the backend</Eyebrow>
          <H2>Vibe-coded apps are quick. Keeping them alive is the hard part.</H2>
          <Lead>
            An agent can write a CRUD app in an afternoon. Then somebody has to host it, secure it, add roles, back it up
            and change it every week. Integram is that part, already done.
          </Lead>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {WHY.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6">
              <Icon size={22} aria-hidden="true" className="text-blue-600" />
              <h3 className="mt-3 text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 leading-relaxed text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="mx-auto flex max-w-3xl gap-5 rounded-2xl border border-blue-200 bg-blue-50 p-7">
          <Eye size={24} aria-hidden="true" className="mt-1 shrink-0 text-blue-700" />
          <div>
            <h2 className="text-xl font-semibold text-slate-900">A sensible setup for production data</h2>
            <p className="mt-2 leading-relaxed text-slate-700">
              Let the agent build in a sandbox workspace with full rights. For live data, connect it as a user whose role
              can read everything it needs but only write to the tables you choose. Review the audit log the first few
              times it runs unattended.
            </p>
          </div>
        </div>
      </Section>

      <Section muted>
        <Faq items={AI_FAQ} title="Questions about AI and MCP" />
      </Section>

      <CtaBand title="Connect your agent to a real backend" text="Free plan includes API and MCP access. Sign up with email, Google or GitHub and connect your first agent in minutes." />
    </>
  )
}
