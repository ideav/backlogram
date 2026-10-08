/**
 * Route table with per-page SEO metadata. Used only at build time by the
 * prerender step (entry-server.tsx → vite.config.ts), never shipped to the
 * browser. Dynamic routes are expanded from the content modules, so a new
 * knowledge-base article or use case gets its page and sitemap entry
 * automatically.
 */
import type { PageKey } from './match'
import { articles } from './content/kb'
import { useCases } from './content/usecases'
import { COMPETITORS } from './data/compare'
import { LEGAL } from './data/legal'
import { AI_FAQ, EXCEL_FAQ, HOME_FAQ, PRICING_FAQ } from './data/faq'
import { PLANS } from './data/pricing'
import { absUrl, BRAND, CONTACT_EMAIL } from './site'

export interface RouteDef {
  path: string
  page: PageKey
  slug?: string
  title: string
  description: string
  /** Name of the OpenGraph image: /img/og/<og>.png */
  og: string
  ogType: 'website' | 'article'
  jsonLd: object[]
  priority: number
  changefreq: 'weekly' | 'monthly' | 'yearly'
  lastmod?: string
}

type Crumb = { name: string; path: string }

const organization = {
  '@type': 'Organization',
  '@id': absUrl('/') + '#organization',
  name: BRAND,
  url: absUrl('/'),
  email: CONTACT_EMAIL,
  contactPoint: [{ '@type': 'ContactPoint', contactType: 'sales', email: CONTACT_EMAIL, url: absUrl('/contact') }],
}

const website = {
  '@type': 'WebSite',
  '@id': absUrl('/') + '#website',
  name: BRAND,
  url: absUrl('/'),
  inLanguage: 'en',
  publisher: { '@id': absUrl('/') + '#organization' },
}

const software = {
  '@type': 'SoftwareApplication',
  name: BRAND,
  url: absUrl('/'),
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web browser; self-hosted via Docker',
  description:
    'Turn spreadsheets into web apps with linked tables, forms, roles, reports, a REST API and an MCP server for AI agents.',
  offers: PLANS.filter((p) => p.price.startsWith('$')).map((p) => ({
    '@type': 'Offer',
    name: p.name,
    price: p.price.replace(/[^0-9.]/g, ''),
    priceCurrency: 'USD',
    url: absUrl('/pricing'),
  })),
  publisher: { '@id': absUrl('/') + '#organization' },
}

function faqPage(items: { q: string; a: string }[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a } })),
  }
}

function breadcrumbs(items: Crumb[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: absUrl(c.path) })),
  }
}

const HOME: Crumb = { name: 'Home', path: '/' }

export function getRoutes(): RouteDef[] {
  const routes: RouteDef[] = [
    {
      path: '/',
      page: 'home',
      title: 'Integram: turn spreadsheets into web apps your AI agents can run',
      description:
        'Upload an Excel file and get a web app with linked tables, forms, roles and reports. Connect Claude or any MCP agent to build on it. Free plan, flat pricing.',
      og: 'home',
      ogType: 'website',
      jsonLd: [organization, website, software, faqPage(HOME_FAQ)],
      priority: 1.0,
      changefreq: 'weekly',
    },
    {
      path: '/pricing',
      page: 'pricing',
      title: 'Pricing: free plan, flat $29 for teams | Integram',
      description:
        'Flat monthly pricing per workspace, not per seat. Free forever plan, Team $29/month for up to 10 users, Business $99/month, self-hosted license.',
      og: 'pricing',
      ogType: 'website',
      jsonLd: [software, faqPage(PRICING_FAQ), breadcrumbs([HOME, { name: 'Pricing', path: '/pricing' }])],
      priority: 0.9,
      changefreq: 'monthly',
    },
    {
      path: '/excel-to-app',
      page: 'excel-to-app',
      title: 'Excel to web app: upload a spreadsheet, get an app | Integram',
      description:
        'Convert an Excel spreadsheet into a multi-user web app with linked tables, forms, roles and live reports. Links between sheets detected automatically.',
      og: 'excel-to-app',
      ogType: 'website',
      jsonLd: [faqPage(EXCEL_FAQ), breadcrumbs([HOME, { name: 'Excel to web app', path: '/excel-to-app' }])],
      priority: 0.9,
      changefreq: 'monthly',
    },
    {
      path: '/ai',
      page: 'ai',
      title: 'A backend for AI agents: MCP server and REST API | Integram',
      description:
        'Connect Claude, ChatGPT or your own agent to Integram via MCP or REST API. Agents create tables, links, roles and records; your team uses the app.',
      og: 'ai',
      ogType: 'website',
      jsonLd: [faqPage(AI_FAQ), breadcrumbs([HOME, { name: 'AI agents', path: '/ai' }])],
      priority: 0.9,
      changefreq: 'monthly',
    },
    ...COMPETITORS.map<RouteDef>((c) => ({
      path: `/compare/${c.slug}`,
      page: 'compare',
      slug: c.slug,
      title: `${c.title} | Integram`.length <= 70 ? `${c.title} | Integram` : c.title,
      description: c.description,
      og: `compare-${c.slug}`,
      ogType: 'website',
      jsonLd: [faqPage(c.faq), breadcrumbs([HOME, { name: c.headline, path: `/compare/${c.slug}` }])],
      priority: 0.8,
      changefreq: 'monthly',
    })),
    {
      path: '/use-cases',
      page: 'use-cases',
      title: 'Use cases: apps teams build from spreadsheets | Integram',
      description:
        'CRM, inventory, orders, project tracking, onboarding, client portals and more: see how teams turn spreadsheets into apps on Integram.',
      og: 'use-cases',
      ogType: 'website',
      jsonLd: [breadcrumbs([HOME, { name: 'Use cases', path: '/use-cases' }])],
      priority: 0.8,
      changefreq: 'monthly',
    },
    ...useCases.map<RouteDef>((uc) => ({
      path: `/use-cases/${uc.slug}`,
      page: 'use-case',
      slug: uc.slug,
      title: `${uc.title} | Integram`,
      description: uc.metaDescription,
      og: `uc-${uc.slug}`,
      ogType: 'website',
      jsonLd: [
        ...(uc.faq.length ? [faqPage(uc.faq)] : []),
        breadcrumbs([HOME, { name: 'Use cases', path: '/use-cases' }, { name: uc.title, path: `/use-cases/${uc.slug}` }]),
      ],
      priority: 0.7,
      changefreq: 'monthly',
    })),
    {
      path: '/knowledge-base',
      page: 'knowledge-base',
      title: 'Knowledge base: guides to replacing spreadsheets | Integram',
      description:
        'Practical guides on data modeling, access control, internal tools and connecting AI agents to business data.',
      og: 'knowledge-base',
      ogType: 'website',
      jsonLd: [breadcrumbs([HOME, { name: 'Knowledge base', path: '/knowledge-base' }])],
      priority: 0.7,
      changefreq: 'weekly',
    },
    ...articles.map<RouteDef>((a) => ({
      path: `/knowledge-base/${a.slug}`,
      page: 'kb-article',
      slug: a.slug,
      title: `${a.title} | Integram`,
      description: a.description,
      og: 'knowledge-base',
      ogType: 'article',
      jsonLd: [
        {
          '@type': 'Article',
          headline: a.title,
          description: a.description,
          datePublished: a.date,
          dateModified: a.date,
          inLanguage: 'en',
          keywords: a.tags.join(', '),
          mainEntityOfPage: absUrl(`/knowledge-base/${a.slug}`),
          image: absUrl('/img/og/knowledge-base.png'),
          author: { '@id': absUrl('/') + '#organization' },
          publisher: organization,
        },
        breadcrumbs([HOME, { name: 'Knowledge base', path: '/knowledge-base' }, { name: a.title, path: `/knowledge-base/${a.slug}` }]),
      ],
      priority: 0.6,
      changefreq: 'monthly',
      lastmod: a.date,
    })),
    {
      path: '/contact',
      page: 'contact',
      title: 'Book a demo | Integram',
      description:
        'Tell us what your spreadsheet should become. A person replies within one business day with a demo built around your case.',
      og: 'contact',
      ogType: 'website',
      jsonLd: [organization, breadcrumbs([HOME, { name: 'Book a demo', path: '/contact' }])],
      priority: 0.6,
      changefreq: 'yearly',
    },
    ...LEGAL.map<RouteDef>((d) => ({
      path: `/${d.slug}`,
      page: 'legal',
      slug: d.slug,
      title: `${d.title} | Integram`,
      description: d.description,
      og: 'legal',
      ogType: 'website',
      jsonLd: [breadcrumbs([HOME, { name: d.title, path: `/${d.slug}` }])],
      priority: 0.2,
      changefreq: 'yearly',
    })),
  ]
  return routes
}
