import type { UseCase } from '../types'

export const useCases: UseCase[] = [
  {
    slug: 'crm',
    title: 'Custom CRM without the per-seat bill',
    metaDescription:
      'Build a CRM that fits how you sell: contacts, deals, follow-ups and reports in one database, with roles for your team and an API for your AI agents.',
    headline: 'A CRM shaped like your sales process, not the other way round',
    subheadline:
      'Turn your lead spreadsheet into a real CRM with contacts, companies, deals, tasks and reports, and let your whole team and your AI agents work in it.',
    audience: 'Small sales teams, agencies, consultants and founders who outgrew a lead spreadsheet but do not want a heavyweight CRM.',
    pains: [
      'Leads live in three spreadsheets, an inbox and somebody\'s notebook, and nobody knows the true pipeline.',
      'Follow-ups are forgotten because nothing reminds anyone that a deal has been quiet for two weeks.',
      'Off-the-shelf CRMs charge per seat, so you ration access and the data goes back into spreadsheets.',
      'Sales reps can see every account, including ones they should not, or they see nothing useful.',
      'Reports are rebuilt by hand every Monday before the pipeline meeting.',
      'Contact details are duplicated, so the same company appears under four spellings.',
    ],
    solution: [
      { title: 'Companies, contacts and deals as linked tables', text: 'Each company is stored once, with its contacts and deals linked to it. Renaming a company or updating an address changes it everywhere.' },
      { title: 'Pipeline stages you define', text: 'Use a fixed list of stages that match your process, and filter, sort and report on them without free-text typos.' },
      { title: 'Roles and access rights', text: 'Give reps their own accounts, managers the whole team and advisers read-only reports, with permissions enforced by the platform.' },
      { title: 'Forms that create leads', text: 'Put a form on your site or share a link; new enquiries land in the leads table with the fields you chose.' },
      { title: 'Live reports', text: 'Pipeline value by stage, deals by owner and overdue follow-ups always read current data, with no weekly rebuild.' },
    ],
    steps: [
      'Upload your existing lead or customer spreadsheet; Integram creates a table you can adjust column by column.',
      'Split it into companies, contacts and deals and link them together.',
      'Define the pipeline stages and the fields each deal needs.',
      'Set up roles for reps, managers and read-only viewers.',
      'Add a lead form and a "follow-ups due" report, then invite the team.',
    ],
    aiAngle:
      'Through the Integram MCP server or REST API, an AI agent can act as a sales assistant with its own limited account. It can read new leads, enrich them with public company information, draft a first reply for a rep to approve, and flag deals with no activity in 14 days. Because it works under a role, it only sees the tables you allow and its changes appear in the record history, so a rep can always see what the agent touched.',
    faq: [
      { q: 'Can I import my existing contacts?', a: 'Yes. Upload an Excel or CSV file, review the column types, and link the contacts to companies and deals.' },
      { q: 'Do I pay for every salesperson?', a: 'Integram is priced by usage rather than by seat, so adding reps, advisers or part-time contractors does not by itself raise the price. Check the pricing page for the current plans.' },
      { q: 'Can reps see only their own deals?', a: 'Yes. Roles and access rights let you restrict what each role can view and edit, including limiting records to their owner.' },
      { q: 'Can a lead form on my website feed the CRM?', a: 'Yes. A form creates records in the leads table, and you choose which fields it asks for.' },
      { q: 'Can I connect it to my email or other tools?', a: 'Integram has a REST API, so other tools and automation services can read and write records. Check the documentation for the integrations you need.' },
    ],
    image: '/img/uc-crm.png',
  },
  {
    slug: 'inventory',
    title: 'Inventory tracking that survives a busy week',
    metaDescription:
      'Replace the stock spreadsheet with an inventory database: items, locations, movements, low-stock alerts and reports, with roles for warehouse staff and managers.',
    headline: 'Know what you have, where it is and what to reorder',
    subheadline:
      'Move your stock sheet into an inventory app with items, locations and movement history, so counts stay right even when several people are working at once.',
    audience: 'Small retailers, workshops, e-commerce sellers and light manufacturers who track stock in Excel or Google Sheets.',
    pains: [
      'Two people update the stock file at the same time and one of the changes disappears.',
      'Counts drift because adjustments are typed over the old number with no record of why.',
      'You find out about a stock-out when a customer orders, not before.',
      'Item names are inconsistent, so the same product has three rows.',
      'Staff on the floor cannot comfortably edit a big sheet on a phone.',
      'Nobody can answer "where did these twelve units go?".',
    ],
    solution: [
      { title: 'Items, locations and movements as separate tables', text: 'Every receipt, issue and transfer is its own record linked to an item and a location, so the current balance is calculated and the history stays intact.' },
      { title: 'Simple forms for the floor', text: 'Staff use a short form on a phone to book goods in or out, with item and location chosen from lists instead of typed.' },
      { title: 'Minimum levels and exception reports', text: 'Set a reorder level per item and keep a live report of everything below it.' },
      { title: 'Roles for warehouse and office', text: 'Operators can book movements, buyers can see balances and prices, and only managers can correct counts.' },
      { title: 'File attachments', text: 'Store delivery notes, photos and supplier documents with the record they belong to.' },
    ],
    steps: [
      'Import your current stock sheet and turn it into an Items table.',
      'Create Locations and a Movements table linked to items and locations.',
      'Add receive, issue and transfer forms for the floor.',
      'Create a "below minimum" report and a stock-by-location view.',
      'Set roles, then run the app next to the old sheet for a week to compare totals.',
    ],
    aiAngle:
      'An AI agent connected through MCP or the REST API can check stock levels each morning, group low items by supplier and draft purchase requests for a buyer to approve. It can also reconcile a supplier\'s packing list against what was booked in and list the differences. With a read-mostly role it can answer questions such as "which items have not moved in 90 days?" without being able to change a balance.',
    faq: [
      { q: 'Does it replace a full warehouse management system?', a: 'It suits small and medium operations that need accurate counts, locations and history. Large automated warehouses with scanners and routing usually need specialist software.' },
      { q: 'Can staff use it on a phone?', a: 'Yes. Forms and lists run in a browser, so staff can book movements from a phone or tablet.' },
      { q: 'How are balances calculated?', a: 'Balances are derived from linked movement records, so you can always trace how a number came about.' },
      { q: 'Can I import my current stock?', a: 'Yes. Upload an Excel or CSV file, confirm the column types and you have an Items table.' },
    ],
    image: '/img/uc-inventory.png',
  },
  {
    slug: 'orders',
    title: 'Order management for growing small businesses',
    metaDescription:
      'Track customers, orders, line items and fulfilment status in one app. Replace order spreadsheets with forms, roles, reports and an API.',
    headline: 'From enquiry to delivery, every order in one place',
    subheadline:
      'Replace the orders spreadsheet with a system that links customers, products and order lines, shows each order\'s status and tells you what is late.',
    audience: 'Made-to-order businesses, distributors, service sellers and online shops that process orders by hand.',
    pains: [
      'Orders arrive by email, chat and phone, and get typed into a sheet later, if at all.',
      'Customer details are retyped on every order and drift out of sync.',
      'It is hard to tell which orders are waiting, in progress or late.',
      'Prices and totals are calculated by formulas that someone occasionally overwrites.',
      'Production, packing and invoicing teams each keep their own copy of the order list.',
      'Month-end reporting means copying figures between files.',
    ],
    solution: [
      { title: 'Customers, products, orders and lines', text: 'Orders link to a customer and contain lines that link to products, so prices and totals come from one source.' },
      { title: 'A status for every step', text: 'Define statuses such as New, Confirmed, In production, Shipped and Paid, and give each team a queue of the orders waiting for it.' },
      { title: 'Order intake forms', text: 'Staff or customers submit orders through forms that validate required fields before a record is created.' },
      { title: 'Reports on what matters', text: 'Orders late, revenue by month, top customers and unpaid orders are reports that always show current data.' },
      { title: 'Roles per team', text: 'Sales can create orders, production can update status, finance can see totals, and nobody edits what they should not.' },
    ],
    steps: [
      'Import your orders sheet and separate customers, products and order lines.',
      'Define order statuses that mirror how work really flows.',
      'Build an order form and a work queue for each team.',
      'Add reports for late and unpaid orders.',
      'Set roles, invite the team and retire the shared sheet.',
    ],
    aiAngle:
      'An AI agent with access through MCP or the REST API can turn an incoming email into a draft order for a human to confirm, check it against product records and flag missing details. It can send a daily summary of late orders to a manager and answer questions such as "what is still unshipped for customer X?" using live records. Its role limits what it can change, and every edit is visible in the history.',
    faq: [
      { q: 'Can customers place orders themselves?', a: 'You can publish a form that creates orders or requests in your database. For logged-in customer views, use roles and access rights to limit each customer to their own records.' },
      { q: 'Does it generate invoices?', a: 'Integram stores the data and reports you need for invoicing. Document generation and accounting integrations can be built through the API; confirm your specific requirements before relying on them.' },
      { q: 'Can I handle different prices per customer?', a: 'Yes, by modelling price lists as their own table linked to customers and products.' },
      { q: 'What if I already have thousands of orders?', a: 'Import them from Excel or CSV. Data is stored in a database, not in a grid, so volume is not limited by spreadsheet row counts.' },
    ],
    image: '/img/uc-orders.png',
  },
  {
    slug: 'project-tracking',
    title: 'Project tracking that people actually update',
    metaDescription:
      'Track projects, tasks, owners, deadlines and time in a relational app. Roles for team and clients, live reports, and an API for AI agents.',
    headline: 'See every project, task and deadline without chasing people',
    subheadline:
      'Move project plans out of scattered spreadsheets into one database where projects, tasks, owners and time entries are linked and always current.',
    audience: 'Agencies, consultancies, internal IT and operations teams running several projects with a mixed team of staff and contractors.',
    pains: [
      'Status lives in meetings and chat, so the plan is out of date by Wednesday.',
      'You cannot see one person\'s workload across all projects.',
      'Contractors and clients need partial visibility, but the plan sheet shows everything or nothing.',
      'Deadlines slip silently because nothing highlights overdue tasks.',
      'Time tracking is a separate sheet that is filled in at month end from memory.',
      'Reporting to clients means building a slide every week.',
    ],
    solution: [
      { title: 'Projects, tasks and people as linked tables', text: 'Each task belongs to a project and an owner, so workload per person and progress per project come from the same data.' },
      { title: 'Views for each audience', text: 'A "my tasks" list for team members, a project overview for managers and a limited view for clients.' },
      { title: 'Roles and external access', text: 'Contractors see only the projects they are linked to, and clients see only their own, with permissions enforced by the platform.' },
      { title: 'Time entries linked to tasks', text: 'Log time against a task and report hours by person, project or client.' },
      { title: 'Overdue and blocked reports', text: 'A live list of overdue tasks and projects without progress, ready for the weekly meeting.' },
    ],
    steps: [
      'Import your task list and create Projects and People tables.',
      'Link tasks to projects and owners and define statuses.',
      'Create "my tasks", "overdue" and project overview screens.',
      'Add a time entry form and an hours-by-project report.',
      'Invite contractors and clients with limited roles.',
    ],
    aiAngle:
      'An AI agent connected via MCP or the REST API can read the task table and write a Monday status digest for each project, listing what moved, what is blocked and what is due. It can draft a client update from the same data for a project manager to review, and suggest a rebalanced assignment when one person is overloaded. As it works under a limited role, it cannot touch projects it has no access to.',
    faq: [
      { q: 'Is this a Gantt chart tool?', a: 'Integram focuses on structured data, lists, reports and workflows. If you need dependency-driven Gantt scheduling, a dedicated planning tool may suit you better, and you can keep project data here.' },
      { q: 'Can clients see progress?', a: 'Yes. Use roles and access rights to give clients a view limited to their own projects.' },
      { q: 'Can I track time?', a: 'Yes, with a time-entries table linked to tasks and people, and reports on the totals.' },
      { q: 'Can I import from Excel or Smartsheet?', a: 'You can import Excel or CSV files, which covers exports from most project tools.' },
    ],
    image: '/img/uc-project-tracking.png',
  },
  {
    slug: 'hr-onboarding',
    title: 'Employee onboarding checklists that do not get lost',
    metaDescription:
      'Run onboarding, offboarding and HR requests from a database: checklists per role, task owners, deadlines, documents and private access for HR.',
    headline: 'Every new hire gets the same great first week',
    subheadline:
      'Turn the onboarding checklist spreadsheet into a process: tasks assigned to the right owners, due dates, documents and a clear view of where each person stands.',
    audience: 'HR managers, office managers and small-business owners who hire a handful of people a year and want consistency.',
    pains: [
      'Onboarding steps live in a document that is copied and edited for every hire.',
      'IT, finance and the manager each assume someone else is setting things up.',
      'Nobody knows which new hire is still waiting for a laptop or a contract.',
      'Sensitive employee data sits in a sheet many people can open.',
      'Offboarding is forgotten, and access stays open after people leave.',
      'You cannot show whether the process is getting faster or slower.',
    ],
    solution: [
      { title: 'Employees and task templates', text: 'Keep a template checklist per role or department and generate the tasks for each new hire from it.' },
      { title: 'Owners and due dates for every task', text: 'IT, finance, the manager and HR each see their own list of what to do before the start date.' },
      { title: 'Private HR data with strict access', text: 'Contracts, personal details and documents are visible only to roles that need them, using access rights on tables and fields.' },
      { title: 'Document storage', text: 'Attach signed forms and ID copies to the employee record rather than emailing them around.' },
      { title: 'Progress reports', text: 'See who has completed what, which steps are late and how long onboarding takes on average.' },
    ],
    steps: [
      'Import your employee list and your current checklist.',
      'Create a Tasks table and a template per role.',
      'Build a "new hire" form that creates the employee and generates their tasks.',
      'Give each department a list of its open tasks.',
      'Restrict HR data to HR and set up an offboarding checklist the same way.',
    ],
    aiAngle:
      'An AI agent with a narrow role can answer new hires\' routine questions from the onboarding records ("who do I ask about expenses?") and remind task owners about items due this week. HR can have the agent draft a welcome message from the employee record. Because the platform enforces access rights, you can keep sensitive tables entirely out of the agent\'s reach and review its actions in the history.',
    faq: [
      { q: 'Is employee data kept private?', a: 'You control access by role and can keep sensitive tables and fields visible only to HR. You can also host the platform on your own server if policy requires it.' },
      { q: 'Can I reuse a checklist for every hire?', a: 'Yes. Keep templates as records and create a copy of the tasks for each new employee.' },
      { q: 'Can the new hire fill in forms themselves?', a: 'Yes. A form can collect details and documents from the new hire before day one.' },
      { q: 'Does it replace an HR information system?', a: 'It covers onboarding, offboarding and HR requests. Payroll and legal compliance tools are outside its scope.' },
    ],
    image: '/img/uc-hr-onboarding.png',
  },
  {
    slug: 'asset-management',
    title: 'Asset management for equipment, devices and tools',
    metaDescription:
      'Track equipment, devices and tools: who has what, where it is, service dates and warranties. Replace the asset spreadsheet with a database and a mobile-friendly form.',
    headline: 'Know where every asset is, who has it and when it needs service',
    subheadline:
      'A proper register for laptops, vehicles, machines and tools, with assignment history, maintenance dates and documents attached to each item.',
    audience: 'IT managers, facilities teams, workshops and small companies with equipment spread across people and locations.',
    pains: [
      'The asset list is a spreadsheet that was accurate once, in the month it was created.',
      'You cannot tell who has a given laptop or tool without asking around.',
      'Warranty and service dates are missed because nobody is reminded.',
      'Equipment goes missing when people leave, because handover was never recorded.',
      'Purchase documents and manuals are scattered across drives and inboxes.',
      'Audits take days of reconciling lists with the physical items.',
    ],
    solution: [
      { title: 'An asset register with typed fields', text: 'Each asset has a category, serial number, purchase date, cost, location and status chosen from lists.' },
      { title: 'Assignment history', text: 'Check out and return events link assets to people, so you can see who had what and when.' },
      { title: 'Service and warranty tracking', text: 'Record service dates and keep a live report of assets due for maintenance or with expiring warranties.' },
      { title: 'Documents with the asset', text: 'Attach invoices, manuals and photos to the record they belong to.' },
      { title: 'Roles for custodians and managers', text: 'Custodians update locations and assignments; finance sees values; only admins change the register structure.' },
    ],
    steps: [
      'Import your current asset list.',
      'Add People, Locations and Assignments tables linked to assets.',
      'Create check-out and return forms usable on a phone.',
      'Add reports for service due, warranty expiring and unassigned items.',
      'Run a stocktake by checking records against physical items.',
    ],
    aiAngle:
      'An AI agent connected via MCP or the REST API can prepare the quarterly stocktake by listing assets that have not been confirmed recently, drafting reminders to their custodians and writing up discrepancies. It can also read a scanned invoice and propose a new asset record for a person to approve. With a role limited to the asset tables, it cannot reach unrelated business data.',
    faq: [
      { q: 'Can I use barcodes or QR codes?', a: 'You can store an asset tag value on each record and look items up by it. Scanner integrations depend on your hardware and can be built against the REST API.' },
      { q: 'Can I track both IT and physical equipment?', a: 'Yes. Use categories and category-specific fields, or separate tables for different asset types.' },
      { q: 'Will it remind me about service dates?', a: 'Reports show assets due for service. Automated notifications can be added through workflows or the API; check which options fit your setup.' },
      { q: 'Can I keep it on my own server?', a: 'Yes, Integram supports self-hosting if you need to keep the register in your own environment.' },
    ],
    image: '/img/uc-asset-management.png',
  },
  {
    slug: 'ai-knowledge-base',
    title: 'A structured knowledge base your AI assistant can use',
    metaDescription:
      'Organize company knowledge as structured records with owners, tags and links, and let AI agents search and answer from it through MCP or API.',
    headline: 'Give your AI assistant a knowledge base it can trust',
    subheadline:
      'Store procedures, answers, policies and product facts as structured, owned and linked records, then connect AI agents that read them through MCP or the REST API.',
    audience: 'Support teams, operations leads, agencies and AI enthusiasts who want assistants that answer from approved company knowledge.',
    pains: [
      'Knowledge is scattered across documents, chats and people\'s heads.',
      'AI assistants confidently answer from outdated or unofficial text.',
      'Nobody owns an article, so wrong answers stay wrong.',
      'You cannot tell which answers are approved and which are drafts.',
      'Customer-facing and internal knowledge are mixed together.',
      'There is no feedback loop showing which questions the knowledge base fails to answer.',
    ],
    solution: [
      { title: 'Articles as structured records', text: 'Each entry has a title, body, category, tags, owner, status and review date, rather than being an unstructured page.' },
      { title: 'Approval workflow', text: 'Draft, review and published statuses, so agents only use content marked as approved.' },
      { title: 'Audience separation with access rights', text: 'Keep internal-only and public articles in the same system but expose each to the right roles.' },
      { title: 'Links to products, customers and processes', text: 'Relate articles to the records they concern, giving agents context rather than isolated text.' },
      { title: 'A questions log', text: 'Record questions that agents or staff could not answer and turn them into new articles.' },
    ],
    steps: [
      'List your most-asked questions and import existing documents or FAQs.',
      'Create an Articles table with status, owner, audience and review date.',
      'Define the review workflow and who may publish.',
      'Connect an AI client to the MCP server with a role that can read only published articles.',
      'Add a questions log and review it weekly.',
    ],
    aiAngle:
      'This is the use case where the AI angle is the point. An assistant connected to the Integram MCP server or REST API can search articles, filter by audience and status, and cite the record it used. A separate drafting agent, with write access only to the drafts table, can propose new articles from the unanswered-questions log for an owner to approve. Keeping read and write roles separate keeps unreviewed text out of customer answers.',
    faq: [
      { q: 'Is this a vector database?', a: 'It is a structured relational database. Agents can query it through MCP or the API by category, tag, status and text. Check the documentation for the search features available in your plan.' },
      { q: 'How do I stop the assistant using draft content?', a: 'Give the agent a role that can read only records with published status, and the platform enforces it.' },
      { q: 'Can I keep the knowledge on my own infrastructure?', a: 'Yes, Integram can be self-hosted, which is useful if the content is sensitive.' },
      { q: 'Which AI clients can connect?', a: 'Any client that supports MCP, or any tool that can call a REST API.' },
    ],
    image: '/img/uc-ai-knowledge-base.png',
  },
  {
    slug: 'client-portal',
    title: 'A client portal without building a website',
    metaDescription:
      'Give clients a secure, branded space to see their projects, orders, documents and requests. Per-client access rights on a shared database.',
    headline: 'Let clients see their own status instead of emailing you for it',
    subheadline:
      'Share exactly the records and documents each client should see, accept requests through forms, and stop answering "where are we with this?" emails.',
    audience: 'Agencies, accountants, installers, consultants and suppliers who manage many clients and want fewer status calls.',
    pains: [
      'Clients email for status updates that you already have in a spreadsheet.',
      'Documents travel by email attachments and nobody finds the latest version.',
      'Sharing a spreadsheet link exposes more than one client\'s data, or requires a separate copy per client.',
      'Requests arrive in chat, email and phone calls and get lost.',
      'You cannot show a client a history of what was done and when.',
      'Per-seat tools make it expensive to give every client contact an account.',
    ],
    solution: [
      { title: 'Per-client access rights', text: 'Each client user sees only the projects, orders and documents linked to their company.' },
      { title: 'A request form', text: 'Clients submit requests that land in your queue with the right client and category attached.' },
      { title: 'Shared documents', text: 'Publish files, reports and approvals to a client\'s record, keeping internal notes separate.' },
      { title: 'Status the client can follow', text: 'Show stage, next step and date for each job, drawn from the same data your team updates.' },
      { title: 'Internal and external fields', text: 'Mark which columns are visible to clients so cost, margins and internal comments stay private.' },
    ],
    steps: [
      'Model Clients, Projects (or Orders) and Documents as linked tables.',
      'Create a client role and restrict it to records linked to the client\'s company.',
      'Choose which fields and documents are visible to clients.',
      'Add a request form for the client to use.',
      'Invite a pilot client, check what they see, then roll out.',
    ],
    aiAngle:
      'An AI agent connected via MCP or the REST API can triage incoming client requests, categorize them, link them to the right client and project, and draft an acknowledgement for your team to send. It can also assemble a weekly client summary from project records. The agent works under a staff-side role, never as a client, and its drafts are reviewed before anything customer-facing goes out.',
    faq: [
      { q: 'Do clients need an account?', a: 'Clients who log in to view their records need a user account with a restricted role. Public request forms do not require one.' },
      { q: 'Will clients see other clients\' data?', a: 'No, if you set the access rights as described. Test by opening the portal as a client user before inviting anyone.' },
      { q: 'Can I brand it with my logo?', a: 'Branding options depend on your plan and setup; ask us what is available for your use.' },
      { q: 'Does adding clients increase the price?', a: 'Integram is priced by usage, not by seat, so more client users do not by themselves raise the price. See the pricing page for plan details.' },
    ],
    image: '/img/uc-client-portal.png',
  },
  {
    slug: 'field-service',
    title: 'Field service management for small crews',
    metaDescription:
      'Schedule jobs, assign technicians, collect photos and notes on site and report on completed work. A simple field service app for small teams.',
    headline: 'Dispatch jobs, capture proof of work and close the loop on site',
    subheadline:
      'From service request to completed job: assign technicians, let them update jobs from a phone with notes and photos, and see what is open at a glance.',
    audience: 'Installers, repair and maintenance companies, cleaning and inspection services with a small crew in the field.',
    pains: [
      'Requests come in by phone and message and are written on paper or in someone\'s notes.',
      'Dispatching is done from memory and a shared calendar.',
      'Technicians report back by chat or at the end of the week, so billing is delayed.',
      'Customer history is not available on site when the same issue returns.',
      'Photos of the work sit in personal phone galleries.',
      'It is hard to know which jobs are late or unassigned.',
    ],
    solution: [
      { title: 'Requests, jobs and technicians', text: 'Requests become jobs linked to a customer, a site and a technician, with a status that follows the work.' },
      { title: 'Mobile-friendly job screen', text: 'Technicians open "my jobs today", add notes, tick a checklist, attach photos and mark the job done from a phone.' },
      { title: 'Customer and site history', text: 'See previous jobs, equipment installed and notes for the same location before the visit.' },
      { title: 'Dispatcher view', text: 'A live list of new, unassigned, in-progress and late jobs, so nothing sits unnoticed.' },
      { title: 'Billing-ready reports', text: 'Completed jobs with time, materials and photos in one report for invoicing.' },
    ],
    steps: [
      'Set up Customers, Sites, Technicians and Jobs tables.',
      'Create a public or internal request form that creates jobs.',
      'Build a dispatcher queue and a technician job screen.',
      'Add fields for checklists, materials, time and photo attachments.',
      'Create a completed-jobs report for invoicing and train the crew on a few real jobs.',
    ],
    aiAngle:
      'An AI agent connected via MCP or the REST API can read an incoming request, classify its urgency, propose a technician based on skills and open workload, and draft the confirmation message for the dispatcher to approve. After a job, it can turn a technician\'s rough notes and photos into a clean summary for the customer. Role-based access keeps it to the job tables, with every change visible in the history.',
    faq: [
      { q: 'Does it work offline?', a: 'Integram is a web application and works best with a connection. Check current offline capabilities before depending on them in areas without coverage.' },
      { q: 'Can technicians upload photos?', a: 'Yes, files can be attached to job records from a phone browser.' },
      { q: 'Does it do route optimization?', a: 'No. It organizes jobs, assignments and records. Route planning would need a separate tool connected through the API.' },
      { q: 'Can customers book through a form?', a: 'Yes. A request form can create jobs in your queue with the fields you choose.' },
    ],
    image: '/img/uc-field-service.png',
  },
  {
    slug: 'budgeting',
    title: 'Budgeting and expense tracking beyond the spreadsheet',
    metaDescription:
      'Plan budgets, record expenses against categories and projects, and track budget versus actual with live reports and approval roles.',
    headline: 'Budget versus actual, without the version-of-the-file problem',
    subheadline:
      'Keep budgets, expenses and approvals in one shared database so everyone works from the same numbers and reports update themselves.',
    audience: 'Finance and operations managers, department heads, nonprofits and small businesses that run budgets in Excel.',
    pains: [
      'Each department keeps its own budget file, and consolidation is a monthly copy-paste exercise.',
      'Actuals are pasted in late, so the report is always a month behind.',
      'Formulas break when someone inserts a row, and the totals are quietly wrong.',
      'Approvals happen by email, so there is no clear record of who agreed what.',
      'Everyone can see everyone\'s numbers, or nobody can see what they need.',
      'You cannot drill from a variance to the invoices that explain it.',
    ],
    solution: [
      { title: 'Budgets, categories and expense records', text: 'Budget lines and expenses are linked to departments, projects and categories, so totals are summed from records.' },
      { title: 'Budget versus actual reports', text: 'Live variance by department, category or project, with drill-down to the underlying expenses.' },
      { title: 'Approval status and owners', text: 'Expenses move through submitted, approved and paid, with each approval attributed to a person.' },
      { title: 'Access by department', text: 'Department heads see their own budgets, finance sees everything, and executives get read-only dashboards.' },
      { title: 'Expense submission form', text: 'Staff submit expenses with category, amount and a receipt attachment, validated before they enter the system.' },
    ],
    steps: [
      'Import last year\'s budget and expense sheets.',
      'Create Departments, Categories, Budget lines and Expenses tables with links.',
      'Add an expense form with receipt upload and an approval status.',
      'Build budget-versus-actual and overdue-approval reports.',
      'Set access by department and retire the consolidated spreadsheet.',
    ],
    aiAngle:
      'An AI agent connected through MCP or the REST API can read receipts and suggest a category and amount for a person to confirm, flag expenses that look duplicated, and write the month-end variance commentary from the live numbers. Give it read access to the budget tables and write access only to a drafts status, so finance stays in control of what is approved.',
    faq: [
      { q: 'Is it an accounting system?', a: 'No. It supports budgeting, expense tracking and reporting. It is not a replacement for a general ledger or tax compliance tools.' },
      { q: 'Can I handle multiple currencies?', a: 'You can store a currency per record and report in the units you choose. Automatic exchange-rate handling depends on how you configure it or integrate through the API.' },
      { q: 'Can I export to Excel?', a: 'Yes. Reports can be exported so finance can continue analysis in a spreadsheet.' },
      { q: 'Can approvers be limited to their own department?', a: 'Yes, roles and access rights control what each approver can see and change.' },
    ],
    image: '/img/uc-budgeting.png',
  },
]
