import type { KbArticle } from '../types'
import { h2, p, ul, ol, callout } from './blocks'

export const article: KbArticle = {
  slug: 'after-excel-agent-ready-business',
  title: 'Where to go after Excel: a business AI agents can work with',
  description:
    'AI assistants are everywhere, yet a plumber, a dental clinic or a repair shop has nothing for them to connect to. Why the gap is infrastructure, not models, and how the spreadsheet you already have becomes one system for your team and for AI agents.',
  date: '2026-11-02',
  readingMinutes: 7,
  tags: ['ai agents', 'mcp', 'excel', 'small business', 'research'],
  blocks: [
    p(
      'The market for AI agents is growing fast. In August 2025 Gartner predicted that by the end of 2026 up to 40% of enterprise applications would include task-specific agents, up from less than 5% a year earlier. Scaling them is another story. In McKinsey’s 2025 survey, 23% of organizations were scaling an agentic system in at least one function, and another 39% were still experimenting.',
    ),
    p(
      'The reason is rarely the model. An agent needs data and a system it can connect to. A large company has those, at least as an ERP with an API. A local business usually has neither.',
    ),
    p(
      'So the market needs two different products. Most teams build agents that do things. We build businesses that agents can work with. Investors see the same split: the Y Combinator Requests for Startups for summer 2026 has a separate category, Software for Agents, for software whose real users are agents and not only people.',
    ),
    h2('The assistant has nothing to connect to'),
    p(
      'Ask an AI assistant to find a plumber for tomorrow or to book you in with a dentist. It will find websites, but it cannot book anything, because the plumber has no system an agent can connect to. The schedule lives in a notebook or a spreadsheet, and requests arrive in a messaging app. The agent is left reading HTML pages and guessing.',
    ),
    p(
      'AgentHermes, a startup that sells agent-readiness tools, describes the gap this way: there are thousands of MCP servers for software and online services, and almost none for local businesses. The company puts the gap at $6.2 billion a year. That is the seller’s own estimate; it does not publish the method, and we found no independent confirmation. The observation itself is easy to check: try booking the nearest car repair shop through an assistant.',
    ),
    p(
      'A hair salon, a clinic, a renovation crew or a small warehouse all have data: customers, services, prices, schedules, stock. But that data sits in spreadsheets and chat threads, and neither an outside person nor an agent can work with it.',
    ),
    p(
      'The owner does not know that they need an "MCP server", and should not have to. What they see is different: customers increasingly ask an assistant for advice and go to the businesses the assistant could actually deal with. The business does not need a technology. It needs to be present where the customer makes the decision.',
    ),
    h2('Custom development does not scale'),
    p(
      'Many small companies already try to close the gap on their own. Emergent, a software platform, surveyed business owners who had built their own software because off-the-shelf products did not fit their processes. The median agency quote for a simple custom build was about $20,000; some reported up to $100,000 and timelines of more than a year. One caveat matters: only owners who had already chosen to build were asked, so this is not a picture of all small businesses.',
    ),
    p(
      'The other half of the problem is knowing what to automate at all. In a Goldman Sachs survey from early 2026, 77% of small businesses that do not use AI yet said they see no use for it in their business.',
    ),
    p(
      'Demand is huge, but it cannot be served one project at a time. A plumber will not commission a $20,000 MCP server or write a specification for an agent integration. What is needed is a tool that fits everyone without a separate build for each.',
    ),
    h2('The way in is the spreadsheet you already have'),
    p(
      'A dental clinic, a car repair shop and a building crew run different processes, but their data looks almost the same: customers, services, orders, staff, dates, amounts. And almost every business has already written all of it down in Excel. The spreadsheet is a ready description of the business, a place to start without any preparation. Rows are records, columns are fields, sheets are entities.',
    ),
    p(
      'An agent needs the same thing, only stricter: explicit field types, links between tables, access rights, and an API to read and write through. The distance between a spreadsheet and a system an agent can connect to turns out to be short, and it can be closed automatically.',
    ),
    p(
      'This is where the data model behind Integram helps. A traditional platform would ask you to design the database schema first. In Integram the structure is stored the same way as the data itself, so you can start from what you already have and add or change fields and tables as you go, without rebuilding the database. That is what makes the approach a mass product rather than a consulting project for each client.',
    ),
    p(
      'You upload your workbook. Integram turns each sheet into a table, recognizes dates, numbers and money, and turns repeated names into links, so each customer or product exists once. You check the structure, invite the team and give each role its own view.',
    ),
    p(
      'The result is not a separate program per customer but one operating environment. The plumber’s app and the dentist’s app differ in their data, yet they run on the same core, with the same API and the same permission model. What works for one business works for all of them at once.',
    ),
    h2('One environment for people and agents'),
    p('Three kinds of users work in that environment.'),
    ul(
      'People. The owner and the staff use an ordinary web interface: lists, record cards, filters, forms and reports. Nobody has to learn to code, and the data stays familiar, because these are the same columns they had in Excel.',
      'Your own AI assistant. Connect Claude, Cursor or any other MCP client and change the app by asking: a new field, a report, a role. Use cases show up while you work, not at a strategy session, which takes care of "I don’t see why I need AI".',
      'Outside agents. An assistant connects through the MCP server or the REST API under a dedicated user account and sees only what that user’s role allows. It can find a free slot in the schedule, create a request, check stock or put together a report.',
    ),
    p(
      'Because all three work in one environment, with one structure and one set of permissions, a change is visible to everyone immediately. The owner asks for a "preferred call time" field, and the field appears on the staff’s record card and in the table schema the outside agent reads.',
    ),
    h2('Example: a device repair shop'),
    p(
      'The shop has an orders sheet: customer, phone, device, fault, technician, status, amount, ready date. A second sheet holds the price list for repairs and a third the spare parts in stock.',
    ),
    ol(
      'The owner uploads the file. Integram creates the tables Orders, Customers, Repairs and Parts, and links orders to customers and repairs.',
      'The owner adds a Technician role that sees only its own orders, and a list of orders grouped by status.',
      'A week later the owner asks their AI assistant, connected through MCP: "Add a report on how much each technician earned this month." The report appears in the same workspace.',
      'The owner creates a separate user for a customer-facing assistant, with read-only access to order statuses, and connects it. Now the agent answers "is my laptop ready?" from real data instead of a guess.',
    ),
    p('At no step was there a specification, a contractor or a separate integration.'),
    h2('What is not solved yet'),
    p('To be honest about the limits of this approach:'),
    ul(
      'An MCP server does not mean you will be found. Connecting to your workspace lets an agent work with your data, but there is no widely used directory where assistants look up local businesses on their own yet. Today the connection is set up by whoever uses the assistant: the owner, an employee or a partner.',
      'Access always goes through a user. An agent has no back door; it works with the rights of its account. For an outside assistant, create a separate user with a narrow role, for example "read the schedule and create a request".',
      'The data has to be kept up to date. An agent that reads a stale schedule makes the same mistakes a person would. An app is easier to keep current than a spreadsheet, but it does not replace discipline.',
      'Complex processes need analysis first. Uploading a spreadsheet is enough for a repair shop or a salon. A factory with quality control, shifts and product labeling is better mapped out with an analyst before anything is built.',
    ),
    callout(
      'Agents are not short of intelligence. They are short of data in a form they can use. Large companies close that gap with integration projects. Small businesses need a mass route that does not charge for each build: the spreadsheet they already have becomes an app that people and agents use with the same data and the same rules.',
    ),
    h2('Sources'),
    ul(
      'Y Combinator, Requests for Startups, category Software for Agents (summer 2026): ycombinator.com/rfs',
      'Gartner press release, 26 August 2025: 40% of enterprise apps will feature task-specific AI agents by 2026, up from less than 5% in 2025.',
      'McKinsey, The state of AI in 2025: Agents, innovation, and transformation.',
      'AgentHermes blog on business agent-readiness: estimates by a vendor of such tools.',
      'IT Brief, One in three small firms build software to fix gaps: a survey by Emergent.',
      'Delaware Inc., overview of AI adoption in small business, summarizing a Goldman Sachs survey.',
    ),
  ],
}
