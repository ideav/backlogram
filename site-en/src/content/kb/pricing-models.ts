import type { KbArticle } from '../types'
import { h2, h3, p, ul, ol, callout } from './blocks'

export const article: KbArticle = {
  slug: 'per-seat-vs-usage-based-pricing',
  title: 'Per-seat vs usage-based pricing: which model fits your team?',
  description:
    'Most no-code and collaboration tools charge per user, a few charge by usage. A practical comparison with a worked cost example, the hidden costs of seat pricing and how to choose.',
  date: '2026-09-29',
  readingMinutes: 7,
  tags: ['pricing', 'per-seat', 'usage-based', 'saas costs', 'comparison'],
  blocks: [
    p(
      'Choosing a business tool is not only a feature decision; it is a decision about how your costs will behave as you grow. Two pricing philosophies dominate. Per-seat pricing charges for each person who has access. Usage-based pricing charges for what the system actually does: actions, records, storage or compute. The right choice depends on how your team really uses the software, and the difference can be a factor of several times on the same workload.',
    ),
    h2('How per-seat pricing works'),
    p(
      'You pay a monthly amount for each user, often tiered by plan: Airtable, Smartsheet, Notion, Monday.com and many CRMs work this way. Features are bundled into plans, and higher plans add things like advanced permissions, audit logs, larger limits or single sign-on. Extras such as automation runs, record limits or storage are capped per plan.',
    ),
    h3('Advantages'),
    ul(
      'Predictable. Ten users times the plan price is the bill. Finance teams like that.',
      'Simple to explain and to compare across vendors.',
      'Aligned with value when every user is a heavy daily user, such as support agents in a helpdesk.',
    ),
    h3('Drawbacks'),
    ul(
      'Occasional users cost as much as heavy ones. A manager who opens a dashboard monthly occupies a full seat.',
      'It taxes collaboration. Every contractor, auditor or client you add makes the bill grow, so people ration access, and the data ends up in side spreadsheets again.',
      'Plan cliffs. A single feature you need, such as granular permissions, can force every user onto the higher tier.',
      'Shared logins appear. When seats are expensive, people share credentials, which destroys auditability.',
      'Costs grow with headcount even if your usage of the system does not.',
    ),
    h2('How usage-based pricing works'),
    p(
      'You pay for consumption. The unit varies by product: API calls, records stored, compute time, automation runs, or a generic credit that approximates one action. Cloud infrastructure providers and many AI services work this way, and a smaller number of business application platforms do as well, Integram among them. Typically there is a subscription that includes a volume of usage, with discounts as the volume rises.',
    ),
    h3('Advantages'),
    ul(
      'You can invite everyone. Viewers, contractors and clients do not add a license cost; what matters is how much work the system does.',
      'Costs follow value. A quiet month is cheap, a busy month costs more.',
      'It suits teams with a wide, shallow user base: many occasional users and few heavy ones.',
      'It fits AI agents, which are non-human users that do not map naturally onto a seat.',
    ),
    h3('Drawbacks'),
    ul(
      'Harder to forecast. A bug or a runaway automation can burn through the allowance.',
      'The unit can be opaque. Is an "action" a click, an API call, a row? You need to understand the definition.',
      'Heavy automated usage may cost more than flat seats, particularly for small teams with intensive workloads.',
      'Comparison shopping is harder because there is no common unit between vendors.',
    ),
    h2('A worked example'),
    p(
      'Consider a service company with 8 core staff, 40 field contractors who update job status a few times a month, 4 managers who read reports, and 2 auditors who look quarterly. That is 54 people with very different intensity.',
    ),
    ul(
      'Under per-seat pricing at an illustrative 20 dollars per user per month, if everyone needs a seat the bill is 1,080 dollars a month. If you give seats only to the 12 people who edit and push the rest through exports and forms, the bill falls to 240 dollars, but you have recreated the spreadsheet-copying problem you wanted to avoid.',
      'Under usage-based pricing, the core staff generate most of the activity. The contractors\' occasional updates add a thin layer, and the auditors almost nothing. The cost scales with the total number of operations, not with 54 accounts.',
    ),
    p(
      'The numbers are illustrative, not a price list. The point is the shape: seat pricing makes the long tail of occasional users expensive, usage pricing makes them nearly free.',
    ),
    callout(
      'Count your users in three groups: daily editors, regular viewers, occasional or external participants. If the third group is larger than the first, seat pricing is working against you.',
    ),
    h2('Hidden costs to look for in either model'),
    ul(
      'Record caps and storage limits that force an upgrade even when user count is flat.',
      'Automation or API run limits that throttle integrations and AI agents.',
      'Features locked to enterprise tiers: audit history, row-level permissions, SSO, data export.',
      'Overage charges and how they are announced. Does the system keep working, or stop at the limit?',
      'Minimum seat counts or annual commitments.',
      'Price changes. Ask what happened to the vendor\'s last three price updates.',
    ),
    h2('How to choose'),
    ol(
      'Map your users: how many, how often, and doing what. A rough list of 20 minutes beats a debate.',
      'Estimate your activity: records created per month, imports, report runs, integrations and agent calls. Rough orders of magnitude are enough.',
      'Price both models at today\'s size and at 3x growth in people and at 3x growth in data. Notice which model punishes which kind of growth.',
      'Check the feature gates. A cheap plan without the permissions you need is not cheap.',
      'Test the limit behavior. Find out what happens at 100% of the allowance.',
      'Ask for the export. Pricing risk is smaller when leaving is cheap.',
    ),
    h2('Which model suits which team?'),
    h3('Per-seat is usually better when'),
    ul(
      'The team is small and everyone works in the tool every day.',
      'You want a fixed monthly cost and little thinking.',
      'The product is a collaboration surface (chat, docs, ticket handling) where each person genuinely uses a seat.',
    ),
    h3('Usage-based is usually better when'),
    ul(
      'Many people touch the data occasionally: contractors, managers, clients, auditors.',
      'You want to give external parties access to forms and portals without per-person fees.',
      'AI agents and integrations do a large share of the work.',
      'Your headcount fluctuates seasonally.',
    ),
    h2('A note on AI and pricing'),
    p(
      'AI agents are changing the equation. A seat assumes a human sitting at a screen. An agent that reads records, drafts replies and updates fields may perform thousands of operations a day on behalf of a single "user", or none for weeks. Platforms that bill by the action make that visible and proportionate, while seat-based ones either ignore agents or invent separate add-on fees. Whichever model you choose, ask explicitly how agent and API activity is counted, and get the answer in writing.',
    ),
    h2('Takeaway'),
    p(
      'Neither model is inherently fairer. Per-seat is simple and predictable; usage-based is flexible and rewards wide access. Look at who actually uses your system and how, price both at the size you expect to be in two years, and pick the one whose growth curve matches your own.',
    ),
  ],
}
