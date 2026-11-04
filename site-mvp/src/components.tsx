import type { ReactNode } from 'react'
import {
  ABOUT,
  AVITO,
  BENEFITS,
  BOOK,
  CALLME,
  CONSENT,
  COOKIES,
  EXAMPLES,
  FEATURED_CASES,
  FOOTER_GROUPS,
  HERO,
  HOW,
  LINKS,
  NAV,
  PARTNER,
  PRICE,
  PROCESS_VIDEO,
  QUESTION,
  SITE,
  SUCCESS,
  TIME,
  TRY,
  WAYS,
  WRITE_US,
} from './content'

// Страницы рисуются на сборке в статический HTML (react-dom/server);
// в браузере React не нужен — формы и плашку cookies оживляет src/main.ts.

function Icon({ name }: { name: 'telegram' | 'whatsapp' }) {
  const d =
    name === 'telegram'
      ? 'M21.5 4.4 2.9 11.6c-1.3.5-1.2 1.2-.2 1.5l4.8 1.5 1.8 5.6c.2.6.1.8.7.8.5 0 .7-.2 1-.5l2.3-2.3 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.7c.3-1.2-.5-1.8-1.3-1.4Zm-3.3 3.6-8.3 7.5-.3 3.4-1.4-4.6 10-6.3Z'
      : 'M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm4.4 13.6c-.2.5-1.1 1-1.5 1-.4.1-.9.1-3-.7-2.5-1.1-4.1-3.700-4.300-3.900-.1-.2-1-1.300-1-2.500s.6-1.800.9-2c.2-.3.5-.3.6-.3h.4c.2 0 .3 0 .5.4l.7 1.700c.1.100.1.300 0 .4l-.3.500-.4.400c-.1.200-.2.300-.1.500.5.900 1.200 1.700 2 2.200.9.600 1.600.8 1.900.9.200.1.400.1.500-.1l.8-.9c.2-.2.300-.2.500-.1l1.600.8c.3.100.4.200.4.300.1.100.1.600-.1 1.100Z'
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <path d={d} fill="currentColor" />
    </svg>
  )
}

export function Header() {
  return (
    <header className="header">
      <div className="wrap header__in">
        <a className="brand" href="/">
          <span className="brand__mark" aria-hidden="true">И</span>
          <span>{SITE.name}</span>
        </a>
        <nav className="nav" aria-label="Разделы">
          {NAV.map(item => (
            <a key={item.href} href={item.href.startsWith('#') ? `/${item.href}` : item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="header__side">
          <a className="icon-link" href={LINKS.headerTelegram} target="_blank" rel="noopener nofollow" aria-label="Напишите нам в Telegram">
            <Icon name="telegram" />
          </a>
          <a className="icon-link" href={LINKS.whatsapp} target="_blank" rel="noopener nofollow" aria-label="Напишите нам в WhatsApp">
            <Icon name="whatsapp" />
          </a>
          <a className="btn btn--dark btn--sm" href={LINKS.login} target="_blank" rel="noopener">
            Войти
          </a>
        </div>
      </div>
    </header>
  )
}

export function Footer({ withLinks }: { withLinks: boolean }) {
  return (
    <footer className="footer" id="contacts">
      <div className="wrap">
        <div className="footer__top">
          <div>
            <p className="footer__tagline">{SITE.tagline}</p>
            <p>
              <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
            </p>
            <p className="footer__legal">{SITE.legal}</p>
            <p>
              <a href={SITE.phoneHref}>{SITE.phone}</a>
            </p>
          </div>
          <div className="footer__social">
            <a className="icon-link icon-link--light" href={LINKS.telegramSite} target="_blank" rel="noopener nofollow" aria-label="Telegram">
              <Icon name="telegram" />
            </a>
            <a className="icon-link icon-link--light" href={LINKS.whatsapp} target="_blank" rel="noopener nofollow" aria-label="WhatsApp">
              <Icon name="whatsapp" />
            </a>
          </div>
        </div>
        {withLinks && (
          <div className="footer__groups">
            {FOOTER_GROUPS.map(group => (
              <div key={group.title}>
                <h3>{group.title}</h3>
                <ul>
                  {group.links.map(link => (
                    <li key={link.href + link.label}>
                      <a href={link.href} target="_blank" rel="noopener">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </footer>
  )
}

export function CookieBar() {
  return (
    <div className="cookie" id="cookie-bar" role="region" aria-label="Cookies" hidden>
      <p>{COOKIES.text}</p>
      <button type="button" className="btn btn--sm" id="cookie-ok">
        {COOKIES.ok}
      </button>
    </div>
  )
}

type FormProps = {
  id: string
  children: ReactNode
  submit: string
  consent?: boolean
  note?: string
  light?: boolean
}

/** Форма заявки: без JS уходит обычным POST, с JS — fetch и переход на /success. */
function LeadForm({ id, children, submit, consent, note, light }: FormProps) {
  return (
    <form className={`lead${light ? ' lead--light' : ''}`} data-form={id} action="/order.php" method="post" noValidate>
      <input type="hidden" name="form" value={id} />
      <div className="hp" aria-hidden="true">
        <label>
          Не заполняйте это поле
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="lead__fields">{children}</div>
      <button type="submit" className="btn btn--accent">
        {submit}
      </button>
      {note && <p className="lead__note">{note}</p>}
      {consent && <p className="lead__note">{CONSENT}</p>}
      <p className="lead__msg" role="status" aria-live="polite" />
    </form>
  )
}

function Field({ label, name, type = 'text', placeholder, required, autoComplete }: {
  label: string
  name: string
  type?: string
  placeholder?: string
  required?: boolean
  autoComplete?: string
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} name={name} placeholder={placeholder} required={required} autoComplete={autoComplete} />
    </label>
  )
}

function Phone({ placeholder = '+7 (000) 000-00-00', label = 'Ваш телефон', required = true }) {
  return <Field label={label} name="phone" type="tel" placeholder={placeholder} required={required} autoComplete="tel" />
}

function SectionHead({ id, title, lead }: { id?: string; title: string; lead?: string }) {
  return (
    <div className="head" id={id}>
      <h2>{title}</h2>
      {lead && <p className="lead-text">{lead}</p>}
    </div>
  )
}

export function Home() {
  return (
    <main>
      <section className="hero">
        <div className="wrap hero__in">
          <h1>{HERO.title}</h1>
          <p className="hero__lead">{HERO.lead}</p>
          <a className="btn btn--accent btn--lg" href="#consult">
            {HERO.cta}
          </a>
          <ul className="pillars">
            {HERO.pillars.map(p => (
              <li key={p.title}>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="band">
        <div className="wrap band__in">
          <p className="band__text">{WRITE_US}</p>
          <a className="btn btn--light" href={LINKS.telegramChannel} target="_blank" rel="noopener nofollow">
            Telegram
          </a>
        </div>
      </section>

      <section className="section">
        <div className="wrap narrow">
          <h2>{TRY.title}</h2>
          <p className="lead-text">
            {TRY.before} <a href={LINKS.register} target="_blank" rel="noopener">{TRY.link}</a>
            {TRY.after}
          </p>
        </div>
      </section>

      <section className="section section--tint" id="how">
        <div className="wrap">
          <SectionHead title={HOW.title} lead={HOW.lead} />
          <ol className="steps">
            {HOW.steps.map((s, i) => (
              <li key={s.title}>
                <span className="steps__n">{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section" id="consult">
        <div className="wrap narrow">
          <LeadForm id="phone-hero" submit="Связаться" note="Бесплатная консультация аналитика">
            <Field label="Ваше имя" name="name" placeholder="введите имя" autoComplete="name" />
            <Phone />
          </LeadForm>
        </div>
      </section>

      <section className="section section--tint">
        <div className="wrap">
          <ul className="cards cards--cases">
            {FEATURED_CASES.map(c => (
              <li key={c.href} className="card">
                <h3>{c.title}</h3>
                <p>{c.text}</p>
                <a className="btn btn--dark btn--sm" href={c.href} target="_blank" rel="noopener">
                  {c.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <SectionHead title={AVITO.title} lead={AVITO.lead} />
          <ul className="cards cards--four">
            {AVITO.items.map(c => (
              <li key={c.title} className="card">
                <h3>{c.title}</h3>
                <p>{c.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--tint">
        <div className="wrap narrow">
          <h2 className="center">{PROCESS_VIDEO}</h2>
          <div className="video">
            <iframe
              src={LINKS.processVideoEmbed}
              title={PROCESS_VIDEO}
              loading="lazy"
              allow="clipboard-write; autoplay; fullscreen"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      <section className="section" id="about">
        <div className="wrap narrow">
          <h2>{ABOUT.title}</h2>
          {ABOUT.paragraphs.map(p => (
            <p key={p} className="lead-text">{p}</p>
          ))}
        </div>
      </section>

      <section className="section section--tint">
        <div className="wrap">
          <SectionHead title={WAYS.title} lead={WAYS.lead} />
          <ul className="ways">
            {WAYS.items.map(w => (
              <li key={w.title} className="way">
                <img src={w.img} alt="" width="600" height="450" loading="lazy" decoding="async" />
                <h3>{w.title}</h3>
                <p>{w.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <SectionHead title={EXAMPLES.title} />
          <ul className="cards cards--three">
            {EXAMPLES.items.map(c => (
              <li key={c.title} className="card">
                <h3>{c.title}</h3>
                <p>{c.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--tint">
        <div className="wrap">
          <SectionHead title={BENEFITS.title} />
          <ul className="cards cards--three">
            {BENEFITS.items.map(c => (
              <li key={c.title} className="card card--accent">
                <h3>{c.title}</h3>
                <p>{c.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section" id="price">
        <div className="wrap">
          <SectionHead title={PRICE.title} lead={PRICE.lead} />
          <ul className="cards cards--three">
            {PRICE.plans.map(p => (
              <li key={p.kind} className="card card--price">
                <p className="card__kind">{p.kind}</p>
                <p className="card__price">{p.price}</p>
                <p>
                  {p.parts.map((part, i) =>
                    typeof part === 'string' ? (
                      <span key={i}>{part}</span>
                    ) : (
                      <a key={i} href={part.href} target="_blank" rel="noopener">{part.text}</a>
                    ),
                  )}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--tint">
        <div className="wrap narrow">
          <h2>{BOOK.title}</h2>
          <p className="lead-text">
            {BOOK.lead} <strong>{BOOK.price}</strong>
            {BOOK.text}
          </p>
          <div className="actions">
            <a className="btn btn--accent" href="#book-form">{BOOK.book}</a>
            <a className="btn btn--ghost" href="#time">{BOOK.expensive}</a>
          </div>
          <div id="book-form" className="panel">
            <LeadForm id="book-hours" submit={BOOK.submit} note={BOOK.note}>
              <Field label="Ваш Email" name="email" type="email" placeholder="Введите ваш Email" autoComplete="email" />
              <Phone label="Или телефон" placeholder="+7 (000) 000-00-00" required={false} />
              <label className="field">
                <span>Количество часов</span>
                <select name="hours" defaultValue={BOOK.hoursSelected}>
                  {BOOK.hours.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </label>
            </LeadForm>
          </div>
        </div>
      </section>

      <section className="section" id="time">
        <div className="wrap narrow">
          <h2>{TIME.title}</h2>
          {TIME.paragraphs.map(p => (
            <p key={p} className="lead-text">{p}</p>
          ))}
          <div className="panel">
            <LeadForm id="phone-save" submit={TIME.cta}>
              <Phone label="Телефон" />
            </LeadForm>
          </div>
        </div>
      </section>

      <section className="section section--dark">
        <div className="wrap narrow">
          <h2>{QUESTION.title}</h2>
          <p className="lead-text">{QUESTION.lead}</p>
          <LeadForm id="question" submit={QUESTION.cta} consent light>
            <Phone label="Телефон" placeholder="Введите телефон" />
            <Field label="Задача или проблема" name="task" placeholder="Кратко задача или проблема" />
          </LeadForm>
        </div>
      </section>

      <section className="section">
        <div className="wrap narrow center">
          <h2>
            {PARTNER.title}{' '}
            <a href={LINKS.builder} target="_blank" rel="noopener">{PARTNER.link}</a>
          </h2>
          <p className="lead-text">{PARTNER.text}</p>
          <a className="btn btn--accent" href={LINKS.register} target="_blank" rel="noopener">
            {PARTNER.cta}
          </a>
        </div>
      </section>
    </main>
  )
}

export function SuccessPage() {
  return (
    <main className="section section--page">
      <div className="wrap narrow center">
        <h1>{SUCCESS.title}</h1>
        <p className="lead-text">{SUCCESS.text}</p>
        <p className="lead-text">
          {SUCCESS.before}
          <a href={LINKS.telegramGroup} target="_blank" rel="noopener nofollow">{SUCCESS.link}</a>
          {SUCCESS.after}
        </p>
        <hr className="sep" />
        <p className="lead-text">{PARTNER.text}</p>
        <a className="btn btn--accent" href={LINKS.register} target="_blank" rel="noopener">
          {PARTNER.cta}
        </a>
      </div>
    </main>
  )
}

export function CallmePage() {
  return (
    <main className="section section--page">
      <div className="wrap narrow">
        <h1>{CALLME.title}</h1>
        <p className="lead-text">{CALLME.lead}</p>
        <div className="panel">
          <LeadForm id="callme" submit={CALLME.cta} consent>
            <Field label="Ваше имя" name="name" placeholder="Ваше имя" autoComplete="name" />
            <Field label="Ваш Email" name="email" type="email" placeholder="Ваш Email" autoComplete="email" />
            <Phone label="Телефон" />
          </LeadForm>
        </div>
      </div>
    </main>
  )
}
