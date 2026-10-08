# Integram EN — positioning, offer and pricing (integram-ai.online)

Source of truth for every English page, ad and article. Written for issue #527 (epic #524).
The English site is not a translation of the Russian one: different market, different pains,
different competitors. When a page and this file disagree, fix the page, or change this file first.

Product facts come from the existing product and the Russian site; anything not listed under
"What we can claim" is not claimed.

## 1. Brand and one-liner

- Brand: **Integram**. Domain: **integram-ai.online**. Contact: `abc@integram-ai.online`.
- One-liner: **Turn spreadsheets into web apps your AI agents can run.**
- Elevator pitch: Upload an Excel file and get a multi-user web app with linked tables, forms,
  roles and reports. Connect Claude or any MCP-compatible agent to build and change it by asking.
  Flat pricing, free plan, cloud or self-hosted.

## 2. Segments

| Segment | Who | Trigger | What they buy |
| --- | --- | --- | --- |
| **A. AI builders** (primary for acquisition) | Indie hackers, technical founders, ops people and consultants who build tools with Claude, Cursor, ChatGPT, n8n | Their agent can write a CRUD app in an hour, but hosting, auth, roles, backups and a UI for non-technical colleagues are still on them | A real backend their agent drives through MCP/REST, with a usable UI for everyone else |
| **B. SMB replacing spreadsheets** (primary for revenue) | Owners and ops managers of 5–200 person companies: distribution, services, field work, agencies, e-commerce back office | Shared spreadsheet breaks: conflicting copies, no permissions, report takes a day | An app built from their own file, flat price for the whole team, optional done-for-you pilot |
| C. Teams leaving Airtable/Smartsheet/Notion | Existing no-code users | Per-seat bill grows, permissions too coarse, data must be self-hosted | Migration from CSV export, flat price, row-level access, self-hosting |

Agencies/consultants are a sub-segment of A who resell builds to B; serve them through "Book a demo".

## 3. Pains (use these, not the Russian ones)

1. **Spreadsheet sprawl.** Copies in inboxes, `final_v3_REALLY_FINAL.xlsx`, nobody trusts the numbers.
2. **No permissions.** Everyone with the file sees salaries, margins and client lists.
3. **Relations by hand.** VLOOKUP chains, the same customer spelled three ways.
4. **Reports by hand.** A person loses a day a month assembling the report.
5. **Per-seat pricing.** Adding the warehouse or field team to Airtable/Smartsheet doubles the bill.
6. **No-code tools hit a wall.** Links and permissions get coarse just when the data matters.
7. **AI-built apps are fragile.** Vibe-coded tools need hosting, auth, roles, backups and maintenance.
8. **Internal software is expensive.** A developer-built internal tool costs months and a budget.

Not used on the English site: import substitution, the Russian software registry, departure of
Western vendors, 152-FZ.

## 4. Competitive frame

| Competitor | Their strength (say it) | Our angle |
| --- | --- | --- |
| Airtable | Polish, templates, ecosystem | Flat price, row-level access, self-hosting, Excel import with links detected, agent control of schema |
| Smartsheet | Gantt and project management, enterprise reach | Relational data instead of sheets, flat price, self-hosting |
| Notion | Docs and wiki, light databases | Operational data with roles and reports; keep Notion for docs |
| Retool | Developer-grade internal tools on your own DB | No database or developer needed; data model included |
| Zoho Creator | Low-code apps inside the Zoho suite | Starts from your spreadsheet, MCP for agents, no suite lock-in |

Rules: competitor cells are qualitative and link to the vendor's own pricing page; no quoted
competitor prices; each comparison page has a "Choose them if" block. Pages exist for Airtable,
Smartsheet and Notion (`/compare/<slug>`). Retool and Zoho Creator are referenced in copy and ads only.

## 5. Core messages

1. **Your spreadsheet becomes an app the same day.** Upload `.xlsx`, tables, types and links are
   detected, you review and invite the team.
2. **A real backend for your AI agent.** MCP server and REST API covering schema, records, users,
   roles and access rules. The agent works inside permissions; every change is logged.
3. **Everyone sees exactly what they should.** Access per table, column and row.
4. **One flat price for the whole team.** Pay for usage (actions), not logins. Free plan forever.
5. **Cloud today, your servers tomorrow.** Docker self-hosting, works offline, bring your own model.

## 6. What we can claim (and what we cannot)

Can claim: Excel/CSV import with detection of tables, data types and links; relational tables
with nested and recursive queries; forms, reports, dashboards; scheduled reports and emails;
roles on tables, columns and rows; audit log of changes; REST API covering users, roles, tables,
columns, links and access rules; MCP server (`integram-mcp` on npm) for Claude Desktop, Claude
Code, Cursor and other MCP clients; webhooks; scheduled re-import, export to Excel; UI templates in
plain HTML/CSS/JS; self-hosting as a Docker container, works without internet; SSO and
LDAP/Active Directory; sign-up with email, Google, GitHub; done-for-you pilot in two weeks.

Do not claim (unverified or not available): a built-in AI assistant on every screen, vector
search, agent memory or knowledge graph as product features; "hundreds of millions of records";
"in production since 2006"; customer counts or logos; uptime SLAs; mobile apps; an open-source
core; certifications (SOC 2, ISO 27001, HIPAA); a template gallery; specific native integrations.

## 7. Pricing (USD)

Model: public price list, flat per workspace, metered by **actions**. Adapted from the Russian
token model, renamed because for AI users "token" means an LLM token.

| Plan | Price | Included | Users | Notes |
| --- | --- | --- | --- | --- |
| Free | $0 forever | 3,000 actions/month | 1 | Import, unlimited tables and links, forms, reports, API and MCP |
| Team | $29/month flat | 15,000 actions/month | up to 10 | Row-level roles, scheduled reports, audit log, email support; overage never locks |
| Business | $99/month flat | 50,000 actions/month | unlimited | Extra packs each 20% cheaper, SSO/LDAP, webhooks, priority support |
| Self-hosted | Custom, annual license | no metering | unlimited | Docker, offline, support agreement — "Talk to us" |

- Extra pack: 10,000 actions for $10 (paid plans).
- Action costs: 1 per simple operation (open table, save record, simple report, one API/MCP call);
  5–10 complex formula recalculation; 10–20 export of 10,000 rows; 30–50 import of 50,000 rows.
- Worked example: 20 operations/hour × 6.5 h × 22 days ≈ 2,860 actions/month → fits Free.
- Done-for-you pilot: first working version on the customer's data in two weeks, **from $1,200**,
  fixed price agreed up front.
- Why not a straight conversion of the Russian prices (1,950 ₽ / 4,900 ₽ / 12,500 ₽ turnkey): the
  Western reference point is per-seat SaaS at $10–45 per user; a flat $29/$99 is a clear,
  memorable undercut for 5–20 person teams, and Free keeps the AI-builder funnel open.
- Taxes excluded; month to month; cancel → workspace drops to Free, data kept.

Open for the owner: annual discount, nonprofit pricing, payment provider.

## 8. Tone of voice

- Plain, specific, confident. Short sentences. Concrete nouns: "stock file", "margins", "field team".
- Honest about limits: every comparison says when the other tool is the better choice.
- No hype words: revolutionary, seamless, game-changing, unlock, supercharge, leverage, empower.
- American English spelling in UI (`organization`, `color`), sentence-case headings.
- CTAs: **Start free** (→ `/start#signup`), **Book a demo** (→ `/contact`), **Log in** (→ `/start`).

## 9. Glossary

| Russian term | English term on the site | Notes |
| --- | --- | --- |
| Интеграм | Integram | Brand, never translated |
| квинтет | — (internal) | Do not use in marketing. If needed: "Integram stores structure as data" |
| рабочее место | workspace (account/DB); role view (screen for a role) | Each user gets their own workspace |
| база данных, БД | database / workspace | "workspace" in UI and pricing |
| таблица / тип | table | |
| реквизит | field | Not "requisite", not "attribute" |
| ссылка (на запись) | link / reference | "linked tables" |
| запрос, отчёт | report / query | "report" for users, "query" for API |
| роль, маска доступа | role, access rule | "row-level access" |
| конструктор | app builder | |
| токен (тарифный) | action | Never "token" for billing |
| пилот | pilot (done-for-you) | |
| личный кабинет | account (`/my`) | |
| заявка | request / demo request | |

## 10. Stop-list

Never on integram-ai.online: Russia or any specific country as our location; Russian legal references
(152-FZ, software registry No. 30872 or any registry number); Russian company names or client
cases (anonymize: "a regional food distributor"); ₽ or ruble prices; RUTUBE, VK, Telegram channel
links, Yandex anything (Metrika, SmartCaptcha, OAuth, Direct, Webmaster); +7 phone numbers; links
to `*.ru` hosts; hreflang to the Russian site; competitors Bitrix24, AmoCRM, 1C; screenshots with
Cyrillic. Legal pages carry the operating entity as `[Legal entity name]` placeholders until the
owner fills them in.

## 11. SEO core (initial)

Primary: `excel to web app`, `airtable alternative`, `spreadsheet to database`, `internal tools
without code`, `no code database`, `mcp server database`, `backend for ai agents`.
Secondary: `smartsheet alternative`, `notion database alternative`, `self-hosted airtable
alternative`, `excel to app`, `turn spreadsheet into app`, `row level permissions spreadsheet`,
plus one query per use case (`inventory tracking app`, `simple crm from excel`, ...).
