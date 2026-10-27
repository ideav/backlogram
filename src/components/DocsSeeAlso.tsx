import { docsRingFor } from '../data/docsRing'

/**
 * «См. также» в начале страницы документации (backlogram#798): остальные
 * справочники по кругу, начиная со следующего. Список — src/data/docsRing.mjs.
 */
export default function DocsSeeAlso({ path }: { path: string }) {
  return (
    <nav aria-label="См. также" className="mt-6 flex flex-wrap items-baseline gap-x-2 gap-y-2 text-sm">
      <span className="text-slate-500 dark:text-slate-400">См. также:</span>
      {docsRingFor(path).map((d) => (
        <a
          key={d.href}
          href={d.href}
          title={d.hint}
          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-blue-400 hover:text-blue-500 transition-colors"
        >
          {d.name}
        </a>
      ))}
    </nav>
  )
}
