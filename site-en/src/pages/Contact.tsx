import { CalendarCheck, Mail, MessagesSquare, Wrench } from 'lucide-react'
import { ContactForm } from '../components/ContactForm'
import { Container, Eyebrow } from '../components/ui'
import { CONTACT_EMAIL } from '../site'

const EXPECT = [
  { icon: MessagesSquare, title: 'A reply from a person', text: 'Within one business day, with a few time slots for a 30-minute call.' },
  { icon: CalendarCheck, title: 'A demo on your problem', text: 'We show Integram on a case like yours, or on your own spreadsheet if you send it.' },
  { icon: Wrench, title: 'An honest answer', text: 'What it would take, what it would cost, and whether another tool would suit you better.' },
]

export default function Contact() {
  return (
    <section className="py-14 sm:py-20">
      <Container className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <Eyebrow>Book a demo</Eyebrow>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Let’s look at your spreadsheet together</h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-600">
            Tell us what the app should do. We will come back with a demo built around your case, or with a plan to build
            it for you.
          </p>
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
          <p className="mt-10 flex items-center gap-2 text-slate-600">
            <Mail size={18} aria-hidden="true" className="text-slate-400" /> Prefer email?{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-blue-700 hover:underline">
              {CONTACT_EMAIL}
            </a>
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
          <ContactForm source="contact" />
        </div>
      </Container>
    </section>
  )
}
