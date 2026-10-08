import { Check, X } from 'lucide-react'
import { Button, Container, CtaBand, Eyebrow, Faq, H2, Img, Lead, Section } from '../components/ui'
import { EXCEL_FAQ } from '../data/faq'
import { SIGNUP_PATH } from '../site'

const DETECTS = [
  { title: 'Tables', text: 'Every sheet with a header row becomes a table. Header names become field names.' },
  { title: 'Data types', text: 'Dates, numbers, money, emails and yes/no columns are recognized, so filters and sorting behave.' },
  { title: 'Links', text: 'A column of customer names in Orders becomes a reference to the Customers table. Each customer now exists once.' },
  { title: 'Lookups', text: 'Columns with a handful of repeating values, like a status, can become small lookup tables, so nobody types “Shipped”, “shipped” and “Shiped”.' },
]

const BEFORE_AFTER: [string, string][] = [
  ['Copies of the file in inboxes and chats', 'One live database in the browser'],
  ['Hidden columns and hoping for the best', 'Roles that decide tables, columns and rows'],
  ['VLOOKUP chains that break when a row moves', 'Links between records that survive any edit'],
  ['A day each month to build the report', 'Reports that are always current, emailed on schedule'],
  ['“Who changed this?”', 'History and an audit log for every change'],
]

const PREP = [
  'One table per sheet, with a single header row at the top.',
  'No merged cells inside the data. Merged titles above the header are fine to delete.',
  'Use the same spelling for the same thing: the import links “Acme Ltd” to “Acme Ltd”, not to “ACME”.',
  'Keep totals and notes off the data rows; reports will calculate the totals for you.',
]

export default function ExcelToApp() {
  return (
    <>
      <section className="border-b border-slate-200">
        <Container className="grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <Eyebrow>Excel to web app</Eyebrow>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              Upload a spreadsheet. Get a web app your whole team can use.
            </h1>
            <Lead>
              Integram turns an Excel workbook into a multi-user application with linked tables, forms, roles and live
              reports. Your data stays exactly as it is; the copies, the merging and the hand-built reports go away.
            </Lead>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button to={SIGNUP_PATH} arrow>
                Upload your file free
              </Button>
              <Button to="/contact" variant="secondary">
                Have us build it
              </Button>
            </div>
            <p className="mt-4 text-sm text-slate-500">Works with .xlsx and CSV. Google Sheets: download as .xlsx first.</p>
          </div>
          <Img src="/img/excel-to-app.png" alt="An Excel workbook converted into a web app with linked tables, a form and a report" eager />
        </Container>
      </section>

      <Section>
        <div className="max-w-2xl">
          <Eyebrow>What the import does</Eyebrow>
          <H2>It reads your workbook the way a database designer would</H2>
          <Lead>You review the result before anything is created, and you can change every decision.</Lead>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {DETECTS.map((d) => (
            <div key={d.title} className="rounded-2xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900">{d.title}</h3>
              <p className="mt-2 leading-relaxed text-slate-600">{d.text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section muted>
        <div className="max-w-2xl">
          <Eyebrow>Before and after</Eyebrow>
          <H2>Same data, different week</H2>
        </div>
        <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="grid grid-cols-2 bg-slate-50 text-sm font-semibold text-slate-700">
            <p className="px-5 py-3.5">With the spreadsheet</p>
            <p className="px-5 py-3.5 text-blue-700">With Integram</p>
          </div>
          <ul className="divide-y divide-slate-100">
            {BEFORE_AFTER.map(([before, after]) => (
              <li key={before} className="grid grid-cols-2">
                <p className="flex gap-2.5 px-5 py-4 text-slate-600">
                  <X size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-slate-400" />
                  {before}
                </p>
                <p className="flex gap-2.5 px-5 py-4 font-medium text-slate-900">
                  <Check size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-blue-600" />
                  {after}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section>
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <Eyebrow>Get the best result</Eyebrow>
            <H2>Five minutes of tidying saves an hour of fixing</H2>
            <Lead>The import copes with real-world files, but these habits make the detected structure right first time.</Lead>
          </div>
          <ol className="space-y-4">
            {PREP.map((p, i) => (
              <li key={p} className="flex gap-4 rounded-xl border border-slate-200 p-5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                  {i + 1}
                </span>
                <span className="leading-relaxed text-slate-700">{p}</span>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <Section muted>
        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Do it yourself</h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              Sign up, upload the file, confirm the structure and invite your team. The free plan covers one user and
              3,000 actions a month; Team is $29 a month flat for up to ten people.
            </p>
            <Button to={SIGNUP_PATH} className="mt-6" arrow>
              Start free
            </Button>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Let us build it</h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              Send the spreadsheet and tell us how the team works. In two weeks you get a working app on your real data,
              with roles, forms and reports, and full admin rights to change it later. Pilots start at $1,200.
            </p>
            <Button to="/contact" variant="secondary" className="mt-6" arrow>
              Book a demo
            </Button>
          </div>
        </div>
      </Section>

      <Section>
        <Faq items={EXCEL_FAQ} />
      </Section>

      <CtaBand title="Bring the spreadsheet. Leave with an app." />
    </>
  )
}
