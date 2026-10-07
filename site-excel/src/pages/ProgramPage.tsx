import type { ReactNode } from 'react'
import { ArrowRight, BadgePercent, Check, GraduationCap, Handshake, Mail, MessageSquare, Server, Sparkles, Users, Wallet } from 'lucide-react'
import { ADEPT, BUSINESS_MODEL, CONTACT_EMAIL, CONTACT_TELEGRAM_URL, PARTNER, PRAKTIKUM } from '../content'
import { SITE_BASE } from '../site-base'
import { StaticPage } from './StaticPage'

const ROLE_ICONS = { platform: Server, adept: GraduationCap, client: Users, partner: Handshake } as const

type Program = typeof ADEPT | typeof PARTNER

/**
 * Страницы рекрутинга (issue #671): адепты — кто освоит платформу и будет
 * учить других применять ИИ, партнёры — кто приводит заказчиков за процент.
 * Это две разные аудитории, поэтому и страницы две, а общий у них только
 * блок бизнес-модели: кто кому платит.
 *
 * Как и остальные спутники, страницы статические и без формы: заявка — письмом
 * или в телеграм. Форма на главной принимает таблицу для демонстрации и сюда
 * не подходит.
 */
export function AdeptPage() {
  return (
    <ProgramPage program={ADEPT} other={PARTNER} visual={<AdeptVisual />} otherNote="Есть свои заказчики? Вы ещё и партнёр — процент за них ваш.">
      <ListSection id="kogo-ishchem" title="Кого ищем" items={ADEPT.who} />
      <ListSection id="chto-poluchite" title="Что получает адепт" items={ADEPT.gets} tinted />
      <p className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 text-slate-600 leading-relaxed">
        Как выглядит вводный урок для заказчика — посмотрите на наш{' '}
        <a href={`${SITE_BASE}${PRAKTIKUM.slug}/`} className="text-blue-600 hover:underline">
          практикум «{PRAKTIKUM.title}»
        </a>
        : адепты будут вести такие же.
      </p>
    </ProgramPage>
  )
}

export function PartnerPage() {
  return (
    <ProgramPage program={PARTNER} other={ADEPT} visual={<PartnerVisual />} otherNote="Хотите сами делать проекты и учить заказчиков — станьте адептом.">
      <ListSection id="komu-podhodit" title="Кому подходит" items={PARTNER.who} />
    </ProgramPage>
  )
}

function ProgramPage({
  program,
  other,
  otherNote,
  visual,
  children,
}: {
  program: Program
  other: Program
  otherNote: string
  visual: ReactNode
  children: ReactNode
}) {
  return (
    <StaticPage
      breadcrumb={[
        { href: SITE_BASE, title: 'Excel → приложение' },
        { href: `${SITE_BASE}${program.slug}/`, title: program.crumb },
      ]}
      h1={program.title}
      lead={program.lead}
      hero={<ProgramHero program={program} visual={visual} />}
      cta={<ProgramCta program={program} other={other} otherNote={otherNote} />}
    >
      {children}

      <ModelSection />

      <section id="kak-ustroeno" className="scroll-mt-16 max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold">Как всё устроено</h2>
        <ol className="mt-6 space-y-4">
          {program.steps.map((step, i) => (
            <li key={step} className="flex items-start gap-4 text-slate-700">
              <span className="shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <span className="pt-1">{step}</span>
            </li>
          ))}
        </ol>
      </section>
    </StaticPage>
  )
}

function ListSection({ id, title, items, tinted = false }: { id: string; title: string; items: readonly string[]; tinted?: boolean }) {
  return (
    <section id={id} className="scroll-mt-16 max-w-5xl mx-auto px-4 sm:px-6 pt-12">
      <div className={`rounded-3xl border p-6 sm:p-8 ${tinted ? 'bg-emerald-50/80 border-emerald-100' : 'border-slate-200'}`}>
        <h2 className="text-2xl font-bold">{title}</h2>
        <ul className="mt-5 space-y-3">
          {items.map(item => (
            <li key={item} className="flex items-start gap-3 text-slate-700">
              <Check size={20} className={`shrink-0 mt-0.5 ${tinted ? 'text-emerald-600' : 'text-blue-600'}`} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/** Четыре роли и правило денег — общий блок обеих страниц. */
function ModelSection() {
  return (
    <section id="model" className="scroll-mt-16 mt-12 bg-gradient-to-b from-slate-50 to-blue-50/50 border-y border-slate-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold">{BUSINESS_MODEL.analogy.title}</h2>
        {BUSINESS_MODEL.analogy.body.map(text => (
          <p key={text} className="mt-4 text-slate-700 leading-relaxed max-w-3xl">
            {text}
          </p>
        ))}
        <h3 className="mt-10 text-xl sm:text-2xl font-bold">Кто кому платит</h3>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {BUSINESS_MODEL.roles.map(({ key, title, body }) => {
            const Icon = ROLE_ICONS[key]
            return (
              <div key={key} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <span className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <Icon size={22} />
                </span>
                <h4 className="mt-4 font-semibold">{title}</h4>
                <p className="mt-2 text-slate-600 leading-relaxed text-sm">{body}</p>
              </div>
            )
          })}
        </div>
        <ul className="mt-8 space-y-3">
          {BUSINESS_MODEL.rules.map(rule => (
            <li key={rule} className="flex items-start gap-3 text-slate-700">
              <Check size={20} className="text-blue-600 shrink-0 mt-0.5" />
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function ProgramCta({ program, other, otherNote }: { program: Program; other: Program; otherNote: string }) {
  const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(program.mailSubject)}`
  return (
    <section id="zayavka" className="scroll-mt-16 max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <div className="rounded-3xl border border-blue-500/30 bg-blue-50/60 p-6 sm:p-10">
        <h2 className="text-2xl sm:text-3xl font-bold">{program.mailSubject}</h2>
        <p className="mt-4 text-slate-700 leading-relaxed max-w-2xl">
          Напишите пару строк о себе — ответим, расскажем подробности и договоримся об условиях.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href={CONTACT_TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg shadow-lg shadow-blue-600/20 transition-colors"
          >
            <MessageSquare size={20} />
            Написать в телеграм
          </a>
          <a
            href={mailto}
            className="inline-flex items-center gap-2 px-7 py-4 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-lg hover:border-blue-500 hover:text-blue-600 transition-colors"
          >
            <Mail size={18} />
            {CONTACT_EMAIL}
          </a>
        </div>
        <p className="mt-6 text-sm text-slate-500 leading-relaxed max-w-2xl">
          {otherNote}{' '}
          <a href={`${SITE_BASE}${other.slug}/`} className="inline-flex items-center gap-1 text-blue-600 hover:underline">
            {other.crumb}
            <ArrowRight size={14} />
          </a>
        </p>
      </div>
    </section>
  )
}

/**
 * Hero страниц рекрутинга — в стиле главной (Landing.tsx): цветные пятна,
 * бейдж, градиентный акцент в заголовке, кнопки и визуальная карточка справа.
 * Без JS всё видно: анимация только у пятен фона.
 */
function ProgramHero({ program, visual }: { program: Program; visual: ReactNode }) {
  const [before, after] = program.title.split(program.titleAccent)
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-violet-50/60 to-emerald-50/50">
      <div className="absolute -top-32 -right-24 w-[28rem] h-[28rem] bg-violet-400/25 blur-[110px] rounded-full pointer-events-none animate-float" />
      <div className="absolute top-40 -left-32 w-[24rem] h-[24rem] bg-blue-400/25 blur-[110px] rounded-full pointer-events-none animate-float-slow" />
      <div className="absolute -bottom-24 right-1/3 w-80 h-80 bg-emerald-300/25 blur-[100px] rounded-full pointer-events-none animate-float" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-16 sm:pb-20">
        <nav aria-label="Хлебные крошки" className="text-sm text-slate-500">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <a href={SITE_BASE} className="hover:text-blue-600 hover:underline">
                Excel → приложение
              </a>
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden="true">/</span>
              <a href={`${SITE_BASE}${program.slug}/`} className="hover:text-blue-600 hover:underline">
                {program.crumb}
              </a>
            </li>
          </ol>
        </nav>
        <div className="mt-8 grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/20 bg-white/80 backdrop-blur text-violet-700 text-sm font-medium shadow-sm">
              <Sparkles size={14} />
              {program.badge}
            </p>
            <h1 className="mt-6 text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1] text-balance">
              {before}
              {/* «15–40%» не рвём после тире: U+2060 (word joiner) снимает точку переноса (#675) */}
              <span className="text-gradient">{program.titleAccent.replace(/(\d)–(?=\d)/g, '$1–⁠')}</span>
              {after}
            </h1>
            <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-2xl">{program.lead}</p>
            <div className="mt-10 flex flex-wrap gap-4">
              <a href="#zayavka" className="btn-primary px-7 py-4 text-lg">
                {program.mailSubject.replace(' Интеграма', '')}
                <ArrowRight size={20} />
              </a>
              <a
                href="#model"
                className="inline-flex items-center gap-2 px-7 py-4 rounded-xl border border-slate-300 bg-white/80 backdrop-blur text-slate-700 font-semibold text-lg hover:border-blue-500 hover:text-blue-600 transition-colors"
              >
                Кто кому платит
              </a>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-700">
              {program.facts.map((fact, i) => (
                <li key={fact} className="inline-flex items-center gap-2">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${FACT_TONES[i % FACT_TONES.length]}`}>
                    <Check size={15} />
                  </span>
                  {fact}
                </li>
              ))}
            </ul>
          </div>
          {visual}
        </div>
      </div>
    </section>
  )
}

const FACT_TONES = ['bg-emerald-100 text-emerald-700', 'bg-blue-100 text-blue-700', 'bg-violet-100 text-violet-700']

/** Путь адепта: от обучения до оплаты напрямую от заказчика. */
function AdeptVisual() {
  const path = [
    { icon: GraduationCap, title: 'Бесплатное обучение', note: 'на реальных таблицах', tone: 'from-blue-500 to-indigo-500' },
    { icon: Sparkles, title: 'Первый проект', note: 'вместе с командой Интеграма', tone: 'from-violet-500 to-fuchsia-500' },
    { icon: Users, title: 'Свои заказчики', note: 'уроки, проекты, поддержка', tone: 'from-emerald-500 to-teal-500' },
  ]
  return (
    <div aria-hidden="true" className="relative hidden sm:block select-none">
      <div className="relative rounded-3xl bg-white/90 backdrop-blur shadow-2xl shadow-indigo-900/15 ring-1 ring-slate-200 p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Путь адепта</p>
        <ol className="mt-5 space-y-4">
          {path.map(({ icon: Icon, title, note, tone }, i) => (
            <li key={title} className="relative flex items-center gap-4">
              {i < path.length - 1 && <span className="absolute left-[1.375rem] top-11 h-4 w-px bg-slate-200" />}
              <span className={`w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br text-white flex items-center justify-center shadow-lg ${tone}`}>
                <Icon size={20} />
              </span>
              <span>
                <span className="block font-semibold text-slate-900">{title}</span>
                <span className="block text-sm text-slate-500">{note}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div className="absolute -bottom-6 -left-4 lg:-left-8 rotate-[-3deg] inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-brand text-white text-sm font-semibold shadow-xl shadow-violet-600/30">
        <Wallet size={16} /> Оплата от заказчика — вам напрямую
      </div>
      <div className="absolute -top-4 -right-3 rotate-[4deg] px-3 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30">
        0 ₽ за обучение
      </div>
    </div>
  )
}

/** Схема партнёра: привели заказчика — платформа платит процент. */
function PartnerVisual() {
  const flow = [
    { icon: Handshake, label: 'Вы' },
    { icon: Users, label: 'Заказчик' },
    { icon: GraduationCap, label: 'Адепт' },
  ]
  return (
    <div aria-hidden="true" className="relative hidden sm:block select-none">
      <div className="rounded-3xl bg-white/90 backdrop-blur shadow-2xl shadow-indigo-900/15 ring-1 ring-slate-200 p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Ваш процент с выручки</p>
        <p className="mt-3 text-6xl lg:text-7xl font-extrabold tracking-tight text-gradient">15–40%</p>
        <div className="mt-8 flex items-center justify-between gap-2">
          {flow.map(({ icon: Icon, label }, i) => (
            <div key={label} className="contents">
              <div className="flex flex-col items-center gap-2">
                <span className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100 flex items-center justify-center">
                  <Icon size={22} />
                </span>
                <span className="text-sm font-semibold text-slate-700">{label}</span>
              </div>
              {i < flow.length - 1 && <ArrowRight size={18} className="text-slate-300 -mt-6" />}
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center gap-3 rounded-2xl bg-emerald-50 ring-1 ring-emerald-100 px-4 py-3 text-sm text-emerald-800">
          <BadgePercent size={20} className="shrink-0" />
          Платформа всегда платит процент тому, кто привёл заказчика
        </div>
      </div>
    </div>
  )
}
