import { Info } from 'lucide-react'
import type { ReactNode } from 'react'
import { A, Breadcrumbs, Container } from '../components/ui'
import { LEGAL, type LegalBlock } from '../data/legal'

/**
 * One layout for the whole legal pack (Terms, Privacy, Cookies, DPA,
 * Sub-processors, Acceptable Use, Copyright, Security); texts live in
 * data/legal/. Bracketed placeholders like [Legal entity name] come from
 * data/legal/config.ts and are filled in at build time by the owner, never
 * invented here.
 */
export default function Legal({ slug }: { slug?: string }) {
  const doc = LEGAL.find((d) => d.slug === slug) ?? LEGAL[0]
  return (
    <article className="py-12 sm:py-16">
      <Container className="max-w-3xl">
        <Breadcrumbs items={[{ name: 'Home', path: '/' }, { name: doc.title, path: `/${doc.slug}` }]} />
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{doc.title}</h1>
        <p className="mt-3 text-sm text-slate-500">Last updated: {doc.updated}</p>
        {doc.slug === 'cookies' && (
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('integram-open-consent'))}
            className="mt-6 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Change my cookie choice
          </button>
        )}
        <div className="mt-8 space-y-5 text-[1.0625rem] leading-relaxed text-slate-700">
          {doc.blocks.map((b, i) => (
            <LegalBlockView key={i} block={b} />
          ))}
        </div>
        <nav aria-label="Legal documents" className="mt-14 border-t border-slate-200 pt-6">
          <p className="text-sm font-semibold text-slate-900">Legal documents</p>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {LEGAL.map((d) => (
              <li key={d.slug}>
                <A to={`/${d.slug}`} className={d.slug === doc.slug ? 'font-semibold text-slate-900' : 'text-blue-700 hover:underline'}>
                  {d.short ?? d.title}
                </A>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </article>
  )
}

/** Inline marks: [label](/path or url) and **bold**. Anything else is plain text. */
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    if (m[1] !== undefined) {
      out.push(
        <A key={m.index} to={m[2]} className="font-medium text-blue-700 underline underline-offset-2">
          {m[1]}
        </A>,
      )
    } else {
      out.push(
        <strong key={m.index} className="font-semibold text-slate-900">
          {m[3]}
        </strong>,
      )
    }
    last = re.lastIndex
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

function LegalBlockView({ block }: { block: LegalBlock }) {
  switch (block.type) {
    case 'h2':
      return <h2 className="pt-6 text-2xl font-bold tracking-tight text-slate-900">{block.text}</h2>
    case 'h3':
      return <h3 className="pt-3 text-xl font-semibold text-slate-900">{block.text}</h3>
    case 'p':
      return <p>{inline(block.text)}</p>
    case 'caps':
      return <p className="font-semibold text-slate-900">{inline(block.text)}</p>
    case 'callout':
      return (
        <aside className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-5 text-slate-800">
          <Info size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-blue-700" />
          <p>{inline(block.text)}</p>
        </aside>
      )
    case 'ul':
    case 'ol': {
      const Tag = block.type
      return (
        <Tag className={`${block.type === 'ul' ? 'list-disc' : 'list-decimal'} space-y-2 pl-6 marker:text-blue-700`}>
          {block.items.map((it, i) => (
            <li key={i}>{inline(it)}</li>
          ))}
        </Tag>
      )
    }
    case 'table':
      return (
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
            <thead>
              <tr>
                {block.head.map((h) => (
                  <th key={h} scope="col" className="border-b-2 border-slate-200 px-3 py-2 align-bottom font-semibold text-slate-900">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i} className="align-top odd:bg-slate-50">
                  {row.map((cell, j) => (
                    <td key={j} className={`border-b border-slate-200 px-3 py-2 ${j === 0 ? 'font-medium text-slate-900' : ''}`}>
                      {inline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    default:
      return null
  }
}
