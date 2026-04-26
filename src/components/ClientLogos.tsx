import React, { useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const CLIENTS = [
  { name: 'БМТ', logo: '/logos/bmt.png' },
  { name: "Domino's", logo: '/logos/dominos.svg' },
  { name: 'Audi', logo: '/logos/audi.svg', small: true },
  { name: 'HRlink', logo: '/logos/hrlink.png', small: true },
  { name: 'UpSound', logo: '/logos/upsound.png', large: true },
  { name: 'ПраВь МСК', logo: '/logos/pravmsk.png' },
  { name: 'Долина Овощей', logo: '/logos/dolina-ovoshchey.png' },
  { name: 'Недорогокупили', logo: '/logos/tyan.png', small: true },
  { name: 'BAIR', logo: '/logos/bair.jpg' },
  { name: 'Milka', logo: '/logos/milka.svg' },
  { name: 'Фонд', logo: '/logos/fyond.png' },
  { name: 'ПМК-178 Бетон', logo: '/logos/pmk178.png' },
  { name: 'Торион', logo: '/logos/torion.png' },
  { name: 'ГидроБот', logo: '/logos/gidrobot.png' },
]

type Client = { name: string; logo: string; small?: boolean; large?: boolean }

// Triple the list for infinite loop
const ITEMS: Client[] = [...CLIENTS, ...CLIENTS, ...CLIENTS]

const CARD_WIDTH = 112  // w-28
const GAP = 32          // gap-8
const STEP = CARD_WIDTH + GAP  // px per card
const SET_WIDTH = CLIENTS.length * STEP

export default function ClientLogos() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)

  // Initialize scroll position to the middle copy
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = SET_WIDTH
    }
  }, [])

  // Infinite loop: jump when reaching edges of the middle copy
  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    if (el.scrollLeft < STEP) {
      el.scrollLeft += SET_WIDTH
    } else if (el.scrollLeft >= SET_WIDTH * 2 - STEP) {
      el.scrollLeft -= SET_WIDTH
    }
  }, [])

  function scroll(dir: 'left' | 'right') {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir === 'left' ? -STEP : STEP, behavior: 'smooth' })
  }

  function onMouseDown(e: React.MouseEvent) {
    isDragging.current = true
    startX.current = e.pageX - (scrollRef.current?.offsetLeft ?? 0)
    scrollLeft.current = scrollRef.current?.scrollLeft ?? 0
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!isDragging.current || !scrollRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollRef.current.offsetLeft
    scrollRef.current.scrollLeft = scrollLeft.current - (x - startX.current)
  }

  function stopDrag() {
    isDragging.current = false
  }

  return (
    <section className="py-16 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-10">
          Воспользовались опытом команды и нашими решениями
        </p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          {/* Left arrow */}
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-all shadow-sm"
            aria-label="Прокрутить влево"
          >
            <ChevronLeft size={18} />
          </button>

          {/* Scrollable track */}
          <div
            ref={scrollRef}
            className="overflow-x-auto scrollbar-none select-none cursor-grab active:cursor-grabbing px-12"
            onScroll={handleScroll}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={stopDrag}
            onMouseLeave={stopDrag}
          >
            <div className="flex gap-8" style={{ width: 'max-content' }}>
              {ITEMS.map((client, i) => (
                <div
                  key={`${client.name}-${i}`}
                  title={client.name}
                  className="w-28 h-16 flex-shrink-0 flex items-center justify-center"
                >
                  <img
                    src={client.logo}
                    alt={client.name}
                    className={`object-contain ${client.small ? 'w-3/4 h-3/4' : client.large ? 'w-4/3 h-4/3' : 'w-full h-full'}`}
                    draggable={false}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Right arrow */}
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-all shadow-sm"
            aria-label="Прокрутить вправо"
          >
            <ChevronRight size={18} />
          </button>
        </motion.div>
      </div>
    </section>
  )
}
