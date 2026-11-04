import type { ReactNode } from 'react'
import {
  CALLBACK,
  COMPOSITION,
  FEATURES,
  FOOTER_LINKS,
  HERO,
  LINKS,
  NAV,
  PAINS,
  PRODUCT,
  PROPOSAL,
  SITE,
  SOLUTION,
  SUCCESS,
} from './content'

// Разметка finmo.integram.io. Рендерится только на сборке (src/prerender.tsx),
// в браузере React не нужен — форму и плашку cookies оживляет src/main.ts.

/** Знак Интеграма: два сцепленных полушестиугольника. */
function Logo() {
  return (
    <svg className="logo__mark" viewBox="-2 -2 35 24.2" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="2.6">
        <path d="M13.9 2.1 11.9 0 0 3.8v12.6l11.9 3.8 9.5-10.1-3.5-3.8" />
        <path d="M17 18.1l2 2.1 11.9-3.8V3.8L19 0 9.5 10.1l3.5 3.8" />
      </g>
    </svg>
  )
}

function Check() {
  return (
    <svg className="check" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M5 10.5l3.2 3.2L15 6.8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Header() {
  return (
    <header className="top">
      <div className="wrap top__row">
        <a className="logo" href="/" aria-label="Интеграм — конструктор финансовых моделей">
          <Logo />
          <span className="logo__text">
            Интеграм<small>финмодели</small>
          </span>
        </a>
        <nav className="top__nav" aria-label="Разделы">
          {NAV.map(item => (
            <a key={item.href} href={'/' + item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <a className="top__phone" href={SITE.phoneHref}>
          {SITE.phone}
        </a>
      </div>
    </header>
  )
}

export function Footer() {
  return (
    <footer className="foot" id="contacts">
      <div className="wrap foot__grid">
        <div>
          <a className="logo logo--light" href="/">
            <Logo />
            <span className="logo__text">
              Интеграм<small>финмодели</small>
            </span>
          </a>
          <p className="foot__legal">{SITE.legal}</p>
        </div>
        <ul className="foot__links">
          {FOOTER_LINKS.map(link => (
            <li key={link.href}>
              <a href={link.href} target="_blank" rel="noopener">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="foot__contacts">
          <a className="foot__phone" href={SITE.phoneHref}>
            {SITE.phone}
          </a>
          <span>{SITE.hours}</span>
          <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
        </div>
      </div>
    </footer>
  )
}

export function CookieBar() {
  return (
    <div className="cookie" id="cookie-bar" role="region" aria-label="Cookies" hidden>
      <p>Мы используем cookies и Яндекс Метрику, чтобы сайт работал и становился удобнее.</p>
      <button type="button" className="btn btn--sm" id="cookie-ok">
        Понятно
      </button>
    </div>
  )
}

function SectionHead({ kicker, title, lead, light }: { kicker?: string; title: string; lead?: string; light?: boolean }) {
  return (
    <div className={`head${light ? ' head--light' : ''}`}>
      {kicker && <p className="kicker">{kicker}</p>}
      <h2>{title}</h2>
      {lead && <p className="head__lead">{lead}</p>}
    </div>
  )
}

function Shot({ image, eager }: { image: { src: string; width: number; height: number; alt: string }; eager?: boolean }) {
  return (
    <figure className="shot">
      <div className="shot__bar" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <img src={image.src} width={image.width} height={image.height} alt={image.alt} loading={eager ? 'eager' : 'lazy'} decoding="async" />
    </figure>
  )
}

function Cell({ value, ours }: { value: string; ours: boolean }) {
  const tone = value === 'нет' ? 'no' : value === 'есть' || value === 'автоматически' ? 'yes' : 'mid'
  return (
    <td className={`cmp__v cmp__v--${tone}${ours ? ' cmp__ours' : ''}`}>
      <span>{value}</span>
    </td>
  )
}

function CallbackForm(): ReactNode {
  return (
    <form className="lead" data-form="callme" action="/order.php" method="post" noValidate>
      <input type="hidden" name="form" value="callme" />
      <div className="lead__trap" aria-hidden="true">
        <label>
          Сайт
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label className="field">
        <span>Ваше имя</span>
        <input type="text" name="name" autoComplete="name" placeholder="Ваше имя" />
      </label>
      <label className="field">
        <span>Телефон</span>
        <input type="tel" name="phone" autoComplete="tel" placeholder="+7 (000) 000-00-00" required />
      </label>
      <button type="submit" className="btn btn--lg">
        {CALLBACK.submit}
      </button>
      <p className="lead__note">{CALLBACK.consent}</p>
      <p className="lead__msg" role="status" aria-live="polite" />
    </form>
  )
}

export function Home() {
  return (
    <main>
      <section className="hero">
        <div className="wrap hero__grid">
          <div className="hero__copy">
            <p className="hero__kicker">{HERO.kicker}</p>
            <h1>{HERO.title}</h1>
            <p className="hero__lead">{HERO.lead}</p>
            <div className="hero__cta">
              <a className="btn btn--lg" href="#proposal">
                {HERO.cta}
              </a>
              <a className="btn btn--lg btn--ghost" href="#features">
                {HERO.ctaSecondary}
              </a>
            </div>
          </div>
          <div className="hero__visual">
            <Shot image={PRODUCT.image} eager />
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <SectionHead kicker={PAINS.kicker} title={PAINS.title} />
          <ol className="pains">
            {PAINS.items.map((item, i) => (
              <li key={item.title} className="pain">
                <span className="pain__n">{String(i + 1).padStart(2, '0')}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="sec sec--tint">
        <div className="wrap solution">
          <div>
            <SectionHead kicker={SOLUTION.kicker} title={SOLUTION.lead} />
            <ul className="ticks">
              {SOLUTION.items.map(item => (
                <li key={item}>
                  <Check />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <aside className="stats">
            {SOLUTION.stats.map(stat => (
              <div key={stat.big} className="stat">
                <span className="stat__big">{stat.big}</span>
                <span className="stat__value">{stat.value}</span>
                <span className="stat__text">{stat.text}</span>
              </div>
            ))}
            <p className="stats__note">{SOLUTION.footnote}</p>
          </aside>
        </div>
      </section>

      <section className="sec" id="features">
        <div className="wrap">
          <SectionHead title={FEATURES.title} lead={FEATURES.lead} />
          <div className="cmp" role="region" aria-label="Сравнение с Excel и SaaS" tabIndex={0}>
            <table>
              <thead>
                <tr>
                  <th scope="col">Функционал</th>
                  {FEATURES.columns.map((col, i) => (
                    <th key={col} scope="col" className={i === 2 ? 'cmp__ours' : undefined}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURES.rows.map(row => (
                  <tr key={row.feature}>
                    <th scope="row">{row.feature}</th>
                    {row.values.map((value, i) => (
                      <Cell key={i} value={value} ours={i === 2} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="verdict">
            {FEATURES.summary.map((text, i) => (
              <li key={text} className={i === 2 ? 'verdict__ours' : undefined}>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="sec sec--dark">
        <div className="wrap">
          <SectionHead kicker={PRODUCT.kicker} title={PRODUCT.title} light />
          <ul className="gains">
            {PRODUCT.items.map(item => (
              <li key={item}>
                <Check />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <SectionHead title={COMPOSITION.title} />
          <div className="parts">
            {COMPOSITION.slides.map((slide, i) => (
              <article key={slide.title} className={`part${i % 2 ? ' part--flip' : ''}`}>
                <div className="part__copy">
                  <span className="part__n">{String(i + 1).padStart(2, '0')}</span>
                  <h3>{slide.title}</h3>
                  <p>{slide.text}</p>
                </div>
                <Shot image={slide.image} />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="sec sec--tint" id="proposal">
        <div className="wrap">
          <SectionHead title={PROPOSAL.title} lead={PROPOSAL.lead} />
          <div className="prose">
            {PROPOSAL.intro.map(p => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <div className="offer">
            <div className="card card--accent">
              <h3>{PROPOSAL.early.title}</h3>
              <p className="card__price">{PROPOSAL.early.price}</p>
              <p>{PROPOSAL.early.text}</p>
            </div>
            <div className="card">
              <h3>{PROPOSAL.cashback.title}</h3>
              {PROPOSAL.cashback.items.map(item => (
                <div key={item.price} className="cashback">
                  <p className="card__price card__price--sm">{item.price}</p>
                  <p>{item.text}</p>
                  {item.conditions.length > 0 && (
                    <ol className="cashback__cond">
                      {item.conditions.map(c => (
                        <li key={c}>{c}</li>
                      ))}
                    </ol>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="license">
            <div>
              <h3>{PROPOSAL.license.title}</h3>
              <p>{PROPOSAL.license.text}</p>
              <p className="license__offer">
                {PROPOSAL.license.offerBefore}
                <a href={LINKS.offer} target="_blank" rel="noopener">
                  {PROPOSAL.license.offerLink}
                </a>
              </p>
            </div>
            <div className="license__cta">
              <a className="btn btn--lg btn--light" href={LINKS.buy} target="_blank" rel="noopener">
                {PROPOSAL.license.buy}
              </a>
              <a className="btn btn--lg btn--outline" href="#callback">
                {PROPOSAL.license.custom}
              </a>
            </div>
          </div>

          <div className="value">
            <h3>{PROPOSAL.value.title}</h3>
            {PROPOSAL.value.lead.map(p => (
              <p key={p}>{p}</p>
            ))}
            <div className="prices">
              {PROPOSAL.value.prices.map(price => (
                <div key={price.text} className="price">
                  <span className="price__value">{price.value}</span>
                  <span>{price.text}</span>
                </div>
              ))}
            </div>
            <p className="value__outro">{PROPOSAL.value.outro}</p>
          </div>
        </div>
      </section>

      <section className="sec callback" id="callback">
        <div className="wrap callback__grid">
          <div>
            <h2>{CALLBACK.title}</h2>
            <p className="head__lead">{CALLBACK.lead}</p>
            <p className="callback__alt">
              Или позвоните: <a href={SITE.phoneHref}>{SITE.phone}</a>, {SITE.hours}
            </p>
          </div>
          <CallbackForm />
        </div>
      </section>
    </main>
  )
}

export function SuccessPage() {
  return (
    <main className="sec success">
      <div className="wrap success__box">
        <h1>{SUCCESS.title}</h1>
        <p>{SUCCESS.text}</p>
        <a className="btn btn--lg" href="/">
          {SUCCESS.back}
        </a>
      </div>
    </main>
  )
}
