# EN legal pack: what the owner and a lawyer must confirm

Internal note, not published. Pages: `/terms`, `/privacy`, `/cookies`, `/dpa`, `/subprocessors`,
`/acceptable-use`, `/copyright`, `/security`. Texts: `site-en/src/data/legal/*.ts`. Refs #531, #524.

The pages are written as a sound baseline, not as legal advice. Until the items below are settled
they show bracketed placeholders on the live site.

## 1. Placeholders (fill once, at build time)

All operator details come from `site-en/src/data/legal/config.ts`. Set the variables in the build
environment (shell, `site-en/.env.local`, or the env of `scripts/en-deploy.sh`) and rebuild:

| Variable | Placeholder | Notes |
|---|---|---|
| `VITE_LEGAL_ENTITY_NAME` | [Legal entity name] | Contracting party in Terms, controller in Privacy, processor in DPA |
| `VITE_LEGAL_ADDRESS` | [Registered address] | |
| `VITE_LEGAL_COMPANY_NUMBER` | [Company number] | |
| `VITE_LEGAL_GOVERNING_LAW` | [Governing law] | Written as "the laws of ..." |
| `VITE_LEGAL_VENUE` | [Venue] | Courts with jurisdiction |
| `VITE_LEGAL_EU_REP` | [EU representative] | GDPR Art. 27, needed if the entity is outside the EU and serves EU users |
| `VITE_LEGAL_UK_REP` | [UK representative] | UK GDPR Art. 27, same logic for the UK |
| `VITE_LEGAL_PRIVACY_EMAIL` | [Contact email for privacy] | Must be a monitored mailbox |
| `VITE_LEGAL_COPYRIGHT_AGENT` | [Designated copyright agent] | Name and address; register the agent with the US Copyright Office for DMCA safe harbor |
| `VITE_LEGAL_HOSTING_PROVIDER` / `_LOCATION` | [Hosting provider] / [Hosting location] | Actual provider of the production server |
| `VITE_LEGAL_PAYMENT_PROCESSOR` / `_LOCATION` | [Payment processor] / [Payment processor location] | No billing integration exists yet |
| `VITE_LEGAL_ARBITRATION` | (unset = placeholder choice) | `on` / `off`, see 2 |
| `VITE_LEGAL_ARBITRATION_PROVIDER` | [Arbitration provider] | e.g. AAA, JAMS, only if arbitration is on |
| `VITE_LEGAL_BACKUPS` | [Backup frequency and storage location] | See 3: no backup job was found on the production host |
| `VITE_LEGAL_LOG_RETENTION` | [Log retention period] | Actual rotation of Apache and app logs |
| `VITE_LEGAL_EMAIL_DELIVERY` | (default: own mail server) | Change if an external SMTP provider is used |
| `VITE_LEGAL_TURNSTILE` | (off) | Set `on` when `INTEGRAM_TURNSTILE_SITEKEY` is configured, so Cloudflare is listed |
| `VITE_LEGAL_UPDATED` | October 8, 2026 | Bump on every material change |

## 2. Decisions for a lawyer

1. **Jurisdiction**: governing law and venue in Terms section 20; SCC clause 17/18 choice in DPA
   section 11 (currently: governing law if it is an EU member state, otherwise the customer's member state).
2. **Arbitration and class action waiver** for US customers (Terms section 21): include or drop;
   check enforceability for consumers in the chosen law, and the provider and rules.
3. **VAT / sales tax**: Terms say taxes are added where required. Decide registration (EU OSS/IOSS,
   UK VAT, US state sales tax nexus) or use a merchant of record, which would change the Terms and
   the sub-processor list.
4. **EU / UK representatives** (Art. 27) depending on where the entity is established.
5. **Consumer terms**: EU/UK 14-day withdrawal right wording (Terms section 7), statutory warranty
   carve-out (section 22), US state auto-renewal laws (California ARL: clear disclosure, online
   cancellation, renewal reminders for yearly plans). Billing UI must match the disclosure.
6. **Liability cap** (fees in 12 months, USD 100 minimum) and indemnity scope.
7. **DMCA agent registration** and DSA single point of contact (Copyright policy).
8. **DPA**: 48-hour breach notice, audit terms, SCC module choices, UK Addendum Table 4 option.
9. **Sub-processor terms**: confirm that a DPA is signed with the hosting provider and Plausible.

## 3. Facts to verify before filling

- No backup cron was found on the production host (only ispmanager jobs); set up and document
  backups before stating them.
- Apache logs for the site rotate under ispmanager; confirm the retention period.
- Paid plans: no payment processor is integrated yet; the auto-renewal and cancellation wording
  must match the billing flow once built ("cancel in account settings").
- In-app AI assistant: users configure their own provider and key, stored in their browser; no
  server-side AI provider is configured on production. If one is configured, it becomes a
  sub-processor.
- Google / GitHub sign-in are not configured on production yet; the texts describe them as optional.
