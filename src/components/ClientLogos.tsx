import React from 'react'
import { motion } from 'framer-motion'

type ClientLogo = {
  name: string
  x: number
  y: number
}

const SHEET_WIDTH = 1151
const SHEET_HEIGHT = 612
const TILE_WIDTH = 214
const TILE_HEIGHT = 183
const SCALE = 0.42

const CLIENTS: ClientLogo[] = [
  { name: 'БМТ', x: 0, y: 0 },
  { name: 'Neoflex', x: 230, y: 0 },
  { name: "Domino's", x: 459, y: 0 },
  { name: 'Audi', x: 689, y: 0 },
  { name: 'RLink', x: 919, y: 0 },
  { name: 'UpSound', x: 0, y: 203 },
  { name: 'Правь МСК', x: 230, y: 203 },
  { name: 'Столица овощей', x: 459, y: 203 },
  { name: 'Неидентифицированный логотип', x: 689, y: 203 },
  { name: 'BAIR', x: 919, y: 203 },
  { name: 'Milka', x: 0, y: 407 },
  { name: 'Ф1', x: 230, y: 407 },
  { name: 'ПМК-178 Бетон', x: 459, y: 407 },
  { name: 'Торион', x: 689, y: 407 },
  { name: 'ГидроБот', x: 919, y: 407 },
]

function LogoTile({ client }: { client: ClientLogo }) {
  return (
    <figure className="group">
      <div className="rounded-[1.75rem] border border-slate-200/80 dark:border-slate-800/90 bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 shadow-[0_16px_40px_rgba(15,23,42,0.06)] dark:shadow-none overflow-hidden transition-transform duration-300 group-hover:-translate-y-1">
        <div
          role="img"
          aria-label={client.name}
          className="mx-auto"
          style={{
            width: `${TILE_WIDTH * SCALE}px`,
            height: `${TILE_HEIGHT * SCALE}px`,
            backgroundImage: 'url("/client-logos/clients-sheet.webp")',
            backgroundRepeat: 'no-repeat',
            backgroundSize: `${SHEET_WIDTH * SCALE}px ${SHEET_HEIGHT * SCALE}px`,
            backgroundPosition: `-${client.x * SCALE}px -${client.y * SCALE}px`,
          }}
        />
      </div>
      <figcaption className="mt-3 text-center text-xs font-semibold tracking-[0.14em] text-slate-500 dark:text-slate-400 uppercase">
        {client.name}
      </figcaption>
    </figure>
  )
}

export default function ClientLogos() {
  return (
    <section className="py-16 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-bold uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500 mb-4">
          Используют нашу платформу
        </p>
        <h2 className="max-w-3xl mx-auto text-center text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white mb-10">
          Подборка логотипов из макета в едином карточном стиле
        </h2>
        <p className="max-w-2xl mx-auto text-center text-sm leading-relaxed text-slate-500 dark:text-slate-400 mb-10">
          Для брендов без отдельно найденных исходников используем аккуратную нарезку из предоставленного референсного листа.
        </p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5"
        >
          {CLIENTS.map((client) => (
            <LogoTile key={client.name} client={client} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
