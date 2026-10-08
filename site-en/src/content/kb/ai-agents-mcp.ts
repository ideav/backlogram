import type { KbArticle } from '../types'
import { h2, h3, p, ul, ol, callout, code } from './blocks'

export const article: KbArticle = {
  slug: 'build-internal-tools-with-ai-agents-mcp-rest-api',
  title: 'Building internal tools with AI agents: MCP, REST API and what actually works',
  description:
    'How AI agents build and operate business apps through a REST API or an MCP server: the workflow, the guardrails, prompts that work, and the failure modes to plan for.',
  date: '2026-09-22',
  readingMinutes: 8,
  tags: ['ai agents', 'mcp', 'rest api', 'internal tools', 'automation'],
  blocks: [
    p(
      'Internal tools are the unglamorous software that runs a company: the order tracker, the onboarding checklist, the inventory sheet with forty columns. Historically you got them in one of three ways: you built a pile of spreadsheets, you hired a developer, or you stretched a SaaS product until it cracked. AI agents add a fourth way. An agent can read a description of your process, propose a data model, build it on a platform through its API, and keep operating it afterwards. This article explains how that works in practice and where the sharp edges are.',
    ),
    h2('The two doors: REST API and MCP'),
    p(
      'For an AI agent to do anything useful in your system it needs a way in. There are two common doors, and a good platform offers both.',
    ),
    h3('REST API'),
    p(
      'A REST API is the standard way programs talk to web applications: HTTP requests to well-defined addresses, with JSON going in and out. Anything that can make web requests can use it, including scripts, automation tools such as Zapier or Make, and AI agents that have been told how the API works. Its strengths are universality and precision. Its weakness, from an agent\'s point of view, is that the agent must first learn the API from documentation, and a model that guesses an endpoint wrong produces confident nonsense.',
    ),
    h3('MCP (Model Context Protocol)'),
    p(
      'MCP is an open protocol, introduced by Anthropic in late 2024 and since adopted by many AI clients, that lets an application describe its capabilities to an AI model in a standard way. Instead of reading documentation, the model is handed a list of tools such as "list tables", "create record" or "run report", each with a description and a typed set of parameters. The client (a desktop assistant, a coding agent, an IDE) then lets the model call those tools.',
    ),
    p(
      'The practical benefit is reliability and speed of setup. You add the platform\'s MCP server to your AI client once, and from then on you can say "create a table for supplier contracts with a renewal date and an owner" in plain language. The model calls the right tools with the right parameters, and you see each call.',
    ),
    callout(
      'Rule of thumb: use MCP when a person is working with an AI assistant interactively; use the REST API when you are wiring the platform into scheduled jobs, webhooks and other systems. A serious platform exposes the same operations, with the same permission checks, through both.',
    ),
    h2('What agents are good at'),
    ul(
      'Drafting the data model. Describe the business in a few sentences and attach a sample spreadsheet. Agents are strong at proposing entities, fields, choice lists and links.',
      'Mechanical build work: creating twenty columns, setting types, configuring forms and import mappings. Tedious for humans, trivial for an agent.',
      'Cleaning and migrating data: normalizing statuses, splitting names, merging duplicates, loading an Excel export into the new tables.',
      'Operating routines: producing a weekly summary, flagging overdue items, filling in missing fields from context, drafting replies from records.',
      'Answering questions about the data in natural language, provided the data is well structured.',
    ),
    h2('What agents are bad at'),
    ul(
      'Knowing your business quirks. The rule that "orders from this distributor are always invoiced net-60" exists only in your head until you say it.',
      'Judging consequences. An agent may happily delete a column that looks unused. Unused to the agent is not unused to your accountant.',
      'Staying within scope without guardrails. Models try to be helpful and will do more than you asked unless the permissions prevent it.',
      'Long chains of dependent steps without checkpoints. Errors compound. A wrong assumption in step two quietly shapes steps three to ten.',
    ),
    h2('A workflow that works'),
    ol(
      'Brief. Give the agent three things: one sentence about the business, your existing spreadsheets or a description of the columns, and two or three sentences about what hurts today. Do not specify screens or field names; let it propose them.',
      'Review the plan before anything is built. Ask for a short, plain-language summary of tables, roles and screens. This is the cheapest moment to catch a wrong assumption.',
      'Build in a sandbox or a fresh workspace. Let the agent create the structure and load sample data.',
      'Test with a script of real scenarios. "Create an order for customer X with two lines", "close it", "run the monthly report". Ask the agent to run them and show results, then run two yourself.',
      'Iterate in plain language. "Managers should not see the cost column." "Add a priority field with Low, Medium, High." Each request should be a small, reviewable change.',
      'Hand over. Create real user accounts and roles, and give the agent its own limited account for ongoing operation.',
    ),
    h2('Guardrails that matter'),
    p(
      'The question to ask any platform before connecting an agent is: what happens when the model is wrong? Four properties turn that from a worry into a manageable risk.',
    ),
    ul(
      'Real permissions, enforced server-side. The agent acts as a user with a role. If the role cannot delete, the agent cannot delete, whatever the prompt says.',
      'Confirmation for destructive operations. Deleting data or restructuring tables should require an explicit approval step.',
      'A visible history. Every change should be attributable to an actor, including the agent, with before-and-after values, so you can undo a bad run.',
      'Environment separation. Rehearse on a copy of the data. If you can export and restore the workspace, a mistake costs minutes instead of days.',
    ),
    h2('Prompts that get better results'),
    p(
      'You do not need prompt-engineering tricks. You need to be specific about outcomes and constraints. Compare:',
    ),
    code(
      'Weak:   "Build me a CRM."\n\nBetter: "We are a 6-person agency selling retainers. Track leads, contacts,\n         deals with a stage and an expected value, and follow-up tasks.\n         Sales reps should see only their own deals; the owner sees all.\n         Import the attached leads.xlsx. Show me the plan before building."',
    ),
    p(
      'Three habits help consistently: state who the users are and what each may see, ask for a plan before action, and tell the agent what not to touch ("do not modify existing tables").',
    ),
    h2('Agents that run on their own'),
    p(
      'Beyond building, agents can operate your app on a schedule or in reaction to events: a new lead arrives through a form, an order changes status, a record has not been updated in two weeks. Typical examples are enriching a new lead with company information, drafting a customer reply for a human to approve, or sending a Monday digest of overdue items. The same rules apply with more force when nobody is watching. Give such agents the narrowest role that works, log everything, and prefer "draft and ask" over "act" for anything customer-facing.',
    ),
    h2('Failure modes to plan for'),
    ul(
      'Hallucinated structure: the agent assumes a field exists that does not. Prevent it by letting the agent read the schema before writing.',
      'Silent partial success: a bulk update that processed 800 of 1,000 rows. Ask for counts and verify them.',
      'Prompt injection: text inside a record or an email tells the agent to do something else. Do not let agents with write access process untrusted content without limits, and keep their permissions narrow.',
      'Drift: a series of well-meant small edits leaves the data model inconsistent. Review structure periodically, as you would review code.',
      'Cost surprises: loops that call the API thousands of times. Use pricing and rate limits that you understand.',
    ),
    h2('How this changes who builds internal tools'),
    p(
      'The biggest effect is not that developers are replaced. It is that the person who understands the process, the operations manager or the founder, can now get a working first version without writing a specification. The specification becomes a conversation, and the first version becomes the specification. Developers are still valuable for integrations, unusual logic and quality control, but they are no longer the bottleneck for the long tail of small internal tools that never made it onto anyone\'s roadmap.',
    ),
    p(
      'If you want to try it, start small: one process, one team, a duplicate of the real data. Connect an AI client to the platform\'s MCP server, ask for a plan, and judge the result the way you would judge a junior hire\'s first week: promising, in need of review, and not yet ready to be left alone with the keys.',
    ),
  ],
}
