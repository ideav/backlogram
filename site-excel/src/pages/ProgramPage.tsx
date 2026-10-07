import type { ReactNode } from 'react'
import { ArrowRight, Check, GraduationCap, Handshake, Mail, MessageSquare, Server, Users } from 'lucide-react'
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
    <ProgramPage program={ADEPT} other={PARTNER} otherNote="Есть свои заказчики? Вы ещё и партнёр — процент за них ваш.">
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
    <ProgramPage program={PARTNER} other={ADEPT} otherNote="Хотите сами делать проекты и учить заказчиков — станьте адептом.">
      <ListSection id="komu-podhodit" title="Кому подходит" items={PARTNER.who} />
    </ProgramPage>
  )
}

function ProgramPage({
  program,
  other,
  otherNote,
  children,
}: {
  program: Program
  other: Program
  otherNote: string
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
      cta={<ProgramCta program={program} other={other} otherNote={otherNote} />}
    >
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <ul className="flex flex-wrap gap-3">
          {program.facts.map(fact => (
            <li key={fact} className="px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold">
              {fact}
            </li>
          ))}
        </ul>
      </section>

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
        <h2 className="text-2xl sm:text-3xl font-bold">Кто кому платит</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {BUSINESS_MODEL.roles.map(({ key, title, body }) => {
            const Icon = ROLE_ICONS[key]
            return (
              <div key={key} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <span className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <Icon size={22} />
                </span>
                <h3 className="mt-4 font-semibold">{title}</h3>
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
