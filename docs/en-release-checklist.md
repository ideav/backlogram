# EN release checklist (integram-ai.online)

Release gate for issue #536 (epic #524). The automated part is
`node scripts/en-release-audit.mjs https://integram-ai.online` (DNS A/AAAA/MX/NS via DoH,
origin geolocation, TLS issuer, headers, robots/sitemap/llms.txt, every sitemap URL
against the same content rules as `tests/en-dist.test.mjs`). Post its Markdown output
as a comment on #536. The items below cannot be checked by a script.

The gate passes only when the audit exits 0 **on the new host** and every item below is ticked
(or recorded as a conscious decision with a reason).

## Before the audit
- [ ] `npm run test:en` is green on the commit being deployed (build + guard tests).
- [ ] Site deployed with `scripts/en-deploy.sh` (see `docs/en-deploy.md`).

## Manual items
**Registrar, DNS, WHOIS**
- [ ] Registrar and nameservers are not Russian (the audit shows NS and RDAP registrar; confirm in the registrar panel).
- [ ] WHOIS privacy on; no Russian registrant/contact visible.
- [ ] DNSSEC decision recorded (on/off).

**Mail (`abc@integram-ai.online`, `mail.integram-ai.online`)**
- [ ] MX points to a non-Russian mail host (or hosted mailbox), the audit's MX geolocation is not RU.
- [ ] SPF record includes the sending host(s) and ends in `~all` or `-all`.
- [ ] DKIM key published and signing verified (send to a Gmail test inbox, "show original": `dkim=pass`).
- [ ] DMARC record exists (`_dmarc.integram-ai.online`, start with `p=none`, move to `quarantine`).
- [ ] Reverse DNS (PTR) of the sending IP matches the mail host name.
- [ ] Test mails from the signup flow and the contact form arrive and are not in spam.

**OAuth and sign-in (email, GitHub, Google only)**
- [ ] GitHub OAuth app: callback `https://integram-ai.online/...` registered, owner is not a Russian entity.
- [ ] Google OAuth client: authorized origin and redirect URI registered; consent screen is English.
- [ ] No Yandex/VK/Mail.ru login buttons or leftover client IDs in the engine config.

**Analytics and third parties**
- [ ] Plausible (or chosen analytics) site created for `integram-ai.online`, script loads from a non-RU host, cookieless.
- [ ] No Yandex Metrika, SmartCaptcha, Google Fonts from RU mirrors; fonts are self-hosted or neutral CDN.
- [ ] Captcha on forms is a non-Russian service (or none).

**Reverse links (the "no connection" condition)**
- [ ] ideav.ru and other RU properties contain **no** links to integram-ai.online (search the RU repo and live pages).
- [ ] No `hreflang` pairing between the sites (the audit checks the EN side).
- [ ] Legacy redirects from the old RU-hosted copy, if any, are limited to an explicit list of old paths (#539).

**Server**
- [ ] Server time zone/locale are neutral (UTC, `en_US`).
- [ ] No Russian text in server error pages (Apache/nginx defaults, PHP error output with `display_errors=Off`).
- [ ] Backups configured and restore tested.
- [ ] Old `Set-Cookie: _locale=EN` from the previous engine is gone (the audit checks `/`).

## Sign-off
- [ ] Audit comment posted on #536 with verdict PASS.
- [ ] Remaining WARN items listed with owner decisions.
