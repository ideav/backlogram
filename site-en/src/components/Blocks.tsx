import { Info } from 'lucide-react'
import type { Block } from '../content/types'

/**
 * Renders content-module blocks (knowledge base, any long-form text). Handles
 * every Block type of the content contract; an unknown type renders nothing
 * rather than breaking the page.
 */
export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-5 text-[1.0625rem] leading-relaxed text-slate-700">
      {blocks.map((b, i) => (
        <BlockView key={i} block={b} />
      ))}
    </div>
  )
}

function BlockView({ block }: { block: Block }) {
  const { type, text = '', items = [] } = block
  switch (type) {
    case 'h2':
      return <h2 className="pt-6 text-2xl font-bold tracking-tight text-slate-900">{text}</h2>
    case 'h3':
      return <h3 className="pt-3 text-xl font-semibold text-slate-900">{text}</h3>
    case 'p':
      return <p>{text}</p>
    case 'ul':
      return (
        <ul className="list-disc space-y-2 pl-6 marker:text-blue-600">
          {items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      )
    case 'ol':
      return (
        <ol className="list-decimal space-y-2 pl-6 marker:font-semibold marker:text-blue-700">
          {items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ol>
      )
    case 'quote':
      return (
        <blockquote className="border-l-4 border-blue-600 pl-5 text-lg italic text-slate-800">{text}</blockquote>
      )
    case 'code':
      return (
        <pre className="overflow-x-auto rounded-xl bg-slate-900 p-5 text-sm leading-relaxed text-slate-100">
          <code>{text}</code>
        </pre>
      )
    case 'callout':
      return (
        <aside className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-5 text-slate-800">
          <Info size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-blue-700" />
          <p>{text}</p>
        </aside>
      )
    default:
      return null
  }
}
