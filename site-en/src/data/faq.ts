/** FAQ sets reused by pages and by their FAQPage JSON-LD. */

export const HOME_FAQ = [
  {
    q: 'What exactly happens when I upload a spreadsheet?',
    a: 'Integram reads every sheet, works out the tables, the data types of each column and which columns point at rows of another sheet. You review that structure, adjust it if needed, and get a web app with a table view, forms for adding records, filters and reports. Your original file is not changed.',
  },
  {
    q: 'Do I need to know SQL or how to code?',
    a: 'No. Tables, links, roles and reports are set up in the interface. If you do code, everything is also available through the REST API, and screens are plain HTML, CSS and JavaScript you can edit.',
  },
  {
    q: 'How do AI agents work with Integram?',
    a: 'Through an MCP server and the REST API. Connect Claude Desktop, Claude Code, Cursor or any MCP client and the agent can create tables, add links, fill in records and run queries in your workspace. It acts with the permissions of the account it uses, so it can never see more than you allowed.',
  },
  {
    q: 'Who can see what?',
    a: 'Roles decide access per table, per column and per row. A sales rep can see only their own clients, a contractor only their own jobs, and nobody outside finance sees margins, all in the same database.',
  },
  {
    q: 'Can I host it myself?',
    a: 'Yes. Integram ships as a Docker container that runs on your own servers and works without internet access. Self-hosting is licensed annually; book a demo and we will size it with you.',
  },
  {
    q: 'What does the free plan include?',
    a: 'One user, 3,000 actions a month, unlimited tables and links, Excel import, forms, reports, and full API and MCP access. That is roughly a couple of hours of active daily work. No credit card needed.',
  },
  {
    q: 'What happens if we go over our monthly actions?',
    a: 'Nothing breaks. On paid plans you keep working and either buy an extra pack or move up a plan next month.',
  },
]

export const PRICING_FAQ = [
  {
    q: 'What is an action?',
    a: 'One operation by a user or an API client: opening a table, saving a record, running a report. Heavy operations count as several actions, for example 10 to 20 for exporting 10,000 rows.',
  },
  {
    q: 'Why not price per seat?',
    a: 'Because the people who only look at data should not double your bill. A flat price per workspace lets you invite the warehouse, the field team and the accountant without doing the math first.',
  },
  {
    q: 'Do API and MCP calls cost extra?',
    a: 'No separate API tier. A call from your agent is counted like the same action done in the interface.',
  },
  {
    q: 'How much does a typical person use?',
    a: 'A busy planner doing about 20 operations an hour, six and a half hours a day, uses around 2,900 actions a month. That fits in the free plan; a team of five working this way fits in Team.',
  },
  {
    q: 'Can I cancel any time?',
    a: 'Yes. Paid plans are month to month. If you cancel, your workspace drops to the free plan and your data stays where it is; you can export it to Excel at any time.',
  },
  {
    q: 'Do you offer discounts for nonprofits or education?',
    a: 'Write to us through the contact form and tell us about your organization. We look at every request individually.',
  },
]

export const EXCEL_FAQ = [
  {
    q: 'Which files can I upload?',
    a: 'Excel workbooks (.xlsx) and CSV files. Each sheet with a header row becomes a table. Google Sheets work too: download as .xlsx and upload.',
  },
  {
    q: 'Will my formulas come across?',
    a: 'Values come across. Calculations you want to keep live are set up as calculated fields or reports in Integram, so they work across linked tables instead of cell ranges.',
  },
  {
    q: 'How are links between sheets detected?',
    a: 'When a column in one sheet holds values that identify rows of another sheet, such as customer names in an Orders sheet, Integram proposes a link. You confirm or change each one before the import.',
  },
  {
    q: 'Can I keep updating the spreadsheet for a while?',
    a: 'Yes. Imports can be repeated, including on a schedule, so a team can switch over gradually. You can also export any table back to Excel at any time.',
  },
  {
    q: 'Is my data safe?',
    a: 'Data travels over HTTPS and is visible only to the users and roles you allow. If it must not leave your network, run Integram self-hosted.',
  },
]

export const AI_FAQ = [
  {
    q: 'Which AI tools can connect to Integram?',
    a: 'Any client that speaks the Model Context Protocol, such as Claude Desktop, Claude Code or Cursor, through the Integram MCP server. Anything that can make HTTP requests, including ChatGPT custom actions and agent frameworks, can use the REST API.',
  },
  {
    q: 'Can the agent break my data?',
    a: 'The agent works with the permissions of the account you connect, so it cannot touch tables or rows that account cannot. Create a dedicated user for the agent and give it only the role it needs. Every change is recorded in the audit log.',
  },
  {
    q: 'Does Integram send my data to an AI model?',
    a: 'Not by itself. Data reaches a model only when you connect an agent and it reads the data. With a self-hosted Integram and a local model, nothing leaves your network.',
  },
  {
    q: 'Do agent requests cost extra?',
    a: 'Each operation the agent performs counts as an action, exactly like the same operation done by a person. Your model provider bills its own usage separately.',
  },
]
