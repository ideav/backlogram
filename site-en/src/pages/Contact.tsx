import { useEffect, useState } from 'react'
import { CalendarCheck, Mail, MessagesSquare, Wrench } from 'lucide-react'
import { ContactForm } from '../components/ContactForm'
import { Container, Eyebrow } from '../components/ui'
import { CONTACT_EMAIL } from '../site'

const EXPECT = [
  { icon: MessagesSquare, title: 'A reply from a person', text: 'Within one business day, with a few time slots for a 30-minute call.' },
  { icon: CalendarCheck, title: 'A demo on your problem', text: 'We show Integram on a case like yours, or on your own spreadsheet if you send it.' },
  { icon: Wrench, title: 'An honest answer', text: 'What it would take, what it would cost, and whether another tool would suit you better.' },
]

/**
 * `/contact?topic=…`: the button that brought the visitor picks the wording, and the
 * topic travels with the request as `source=contact-<topic>`. The page is prerendered
 * without a query, so the topic is applied after hydration.
 */
const TOPICS = {
  demo: {
    eyebrow: 'Book a demo',
    title: 'Let’s look at your spreadsheet together',
    lead: 'Tell us what the app should do. We will come back with a demo built around your case, or with a plan to build it for you.',
    form: {},
  },
  build: {
    eyebrow: 'Have us build it',
    title: 'Send the spreadsheet, get a working app',
    lead: 'Tell us how the team works today. We will reply with a plan, a timeline and a price for building the app on your real data.',
    form: { submitLabel: 'Request a build' },
  },
  'self-hosted': {
    eyebrow: 'Self-hosted',
    title: 'Integram on your own servers',
    lead: 'An annual license: Docker in your network, LDAP / Active Directory and SSO, a support agreement. Tell us about your team and requirements, and we will reply with options and a price.',
    form: {
      taskLabel: 'What do you need?',
      taskPlaceholder: 'For example: 200 users, self-hosted on our servers, sign-in through Active Directory, a support agreement.',
      submitLabel: 'Talk to us',
    },
  },
  feedback: {
    eyebrow: 'Tell us',
    title: 'Spotted something wrong?',
    lead: 'If a comparison, price or fact on this site is out of date, tell us where and what changed. We check every report and fix the page.',
    form: {
      taskLabel: 'What is wrong, and where?',
      taskPlaceholder: 'For example: the Airtable comparison lists the old row limit for the Team plan.',
      submitLabel: 'Send',
      successText: 'We will check it and fix the page. If we need details, a person from our team will write back.',
    },
  },
} as const

type Topic = keyof typeof TOPICS

function readTopic(): Topic {
  const t = new URLSearchParams(window.location.search).get('topic')
  return t && t in TOPICS ? (t as Topic) : 'demo'
}

export default function Contact() {
  const [topic, setTopic] = useState<Topic>('demo')
  useEffect(() => setTopic(readTopic()), [])
  const t = TOPICS[topic]

  return (
    <section className="py-14 sm:py-20">
      <Container className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <Eyebrow>{t.eyebrow}</Eyebrow>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">{t.title}</h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-600">{t.lead}</p>
          {topic !== 'feedback' && (
            <ul className="mt-10 space-y-6">
              {EXPECT.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-4">
                  <Icon size={22} aria-hidden="true" className="mt-0.5 shrink-0 text-blue-600" />
                  <div>
                    <p className="font-semibold text-slate-900">{title}</p>
                    <p className="mt-1 leading-relaxed text-slate-600">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-10 flex items-center gap-2 text-slate-600">
            <Mail size={18} aria-hidden="true" className="text-slate-400" /> Prefer email?{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-blue-700 hover:underline">
              {CONTACT_EMAIL}
            </a>
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
          <ContactForm source={topic === 'demo' ? 'contact' : `contact-${topic}`} {...t.form} />
        </div>
      </Container>
    </section>
  )
}
