import type { KbArticle } from '../types'
import { h2, h3, p, ul, ol, callout } from './blocks'

export const article: KbArticle = {
  slug: 'access-control-for-teams',
  title: 'Access control for teams: roles, permissions and sharing without chaos',
  description:
    'How to design roles and access rights for a shared business database: least privilege, row-level versus table-level rules, external users, auditing, and the traps of sharing spreadsheets.',
  date: '2026-09-19',
  readingMinutes: 7,
  tags: ['access control', 'roles', 'permissions', 'security', 'teams'],
  blocks: [
    p(
      'The moment more than one person works with the same data, a question appears: who is allowed to see and change what? In a spreadsheet the honest answer is usually "whoever has the link". That is fine for a team of three, and a real risk for a team of thirty with contractors, interns and clients in the mix. This article explains how to design access rules that are strict enough to protect you and simple enough that people do not route around them.',
    ),
    h2('Why spreadsheet sharing falls short'),
    p(
      'Google Sheets and Excel Online offer viewer, commenter and editor roles on a whole file, and some protection of ranges and sheets. That covers a surprising amount of ground, but it stops at certain predictable places:',
    ),
    ul(
      'Row-level restriction is not really possible. If a salesperson may only see their own accounts, the usual workaround is one copy of the file per person, which is the beginning of version chaos.',
      'Hidden sheets and hidden columns are not security. Anyone with edit access can unhide them, and anyone with view access can often read them through export or a formula.',
      'Protected ranges are easy to forget. New columns and new sheets are unprotected by default.',
      'A shared link is a credential. Once forwarded, you cannot tell who is using it.',
      'There is rarely a trustworthy record of who viewed or changed what.',
    ),
    h2('The principle: least privilege'),
    p(
      'Give every person the smallest set of permissions that lets them do their job, and expand only when there is a reason. It sounds like bureaucracy, but it is mostly about avoiding two failure modes: accidental damage (someone deletes a table while tidying up) and disclosure (a contractor sees pricing for every other client). Both are far more common than malicious attacks.',
    ),
    h2('Build roles around jobs, not individuals'),
    p(
      'Do not assign permissions person by person. Define a handful of roles that match the way your organization works, then assign people to roles. When someone changes jobs you change one assignment instead of editing dozens of rules. A typical small-business set looks like this:',
    ),
    ul(
      'Administrator: manages users, structure and settings. Keep this group very small.',
      'Manager: sees and edits the whole team\'s data, runs reports, cannot change the data structure.',
      'Staff member: creates and edits their own records, sees shared reference data, cannot delete.',
      'Read-only: can view dashboards and reports, for executives, auditors and advisers.',
      'External: customers, suppliers or contractors who see only the records that concern them.',
    ),
    h2('Four layers of permission'),
    p(
      'It helps to think about access as four layers, from coarse to fine. A good platform lets you control each of them; the more of them you can express, the fewer workarounds you need.',
    ),
    h3('1. Workspace level'),
    p(
      'Who is in the workspace at all, and who can invite others or change billing. This is the front door.',
    ),
    h3('2. Table level'),
    p(
      'Which tables a role can see, and for each one: view, create, edit, delete. A support agent might create and edit tickets but only view the product catalog. Finance might view orders but never see the HR table.',
    ),
    h3('3. Column level'),
    p(
      'Which fields in a visible table are shown. The classic example is a purchase price or a salary column that most users should not see even though they need the rest of the record.',
    ),
    h3('4. Row level'),
    p(
      'Which records in a table the user may open. "Sales reps see only accounts they own", "a client sees only their own orders", "a regional manager sees their region". This is the layer that spreadsheets cannot do and that most teams eventually need.',
    ),
    callout(
      'If a rule can be expressed as "people see records linked to them or to their team", you can usually implement it with a relationship in the data rather than a hand-maintained list of exceptions. Linked tables and access control reinforce each other.',
    ),
    h2('Designing the rules: a worked example'),
    p(
      'Imagine a design agency with five employees, three freelancers and a dozen clients. They keep projects, tasks, time entries and invoices.',
    ),
    ol(
      'Owners are Administrators. They manage users and see everything.',
      'The two project managers are Managers: all projects, tasks and time entries, plus invoices in view-only mode.',
      'Designers are Staff: they see tasks assigned to them and the projects those tasks belong to, and can log time against their own tasks only.',
      'Freelancers are Staff with a narrower scope: only the specific projects they are linked to, no access to invoices.',
      'Clients are External: they see their own projects and approved deliverables, and can add comments, but cannot see internal time entries or rates.',
    ),
    p(
      'Notice that most of these rules are expressed through links ("tasks assigned to me", "projects I am linked to") rather than lists of individual records. When a new freelancer joins a project, you link them once and the access follows.',
    ),
    h2('External users and public forms'),
    p(
      'Sooner or later you want people outside the company to submit or view data: a lead capture form on your website, a support request form, a client portal. Treat these as separate from internal accounts. Public forms should only be able to create records in one specific table with specific fields, never to read anything. A client portal should authenticate each person and apply the same row-level rules described above. Avoid the shortcut of sharing an internal view by link; links leak.',
    ),
    h2('Auditing: knowing who did what'),
    p(
      'Permissions prevent problems and a history explains the ones that happen anyway. Look for a per-record change log (who changed which field, from what to what, and when) and a log of sign-ins. When something looks wrong in a report, the first question is always "what changed?", and the answer should take seconds rather than a forensic investigation.',
    ),
    h2('Access control and AI agents'),
    p(
      'Connecting an AI agent to your business data raises the stakes. An agent that operates through a platform\'s REST API or MCP server should be treated like a user, with its own account, its own role and the same permission checks as everyone else. Avoid giving agents a single all-powerful key. A sensible setup looks like this:',
    ),
    ul(
      'Create a dedicated user for each agent or integration, with a role limited to the tables it needs.',
      'Prefer read-only access until the agent has proved itself, then grant write access table by table.',
      'Require confirmation for destructive actions such as deleting records or changing structure.',
      'Review the history regularly. Agent actions should be as visible as human ones.',
    ),
    p(
      'This is not paranoia. Language models can misread an instruction, and a prompt-injected document can try to steer them. Permissions enforced by the platform are the safety net that does not depend on the model behaving well.',
    ),
    h2('Common mistakes'),
    ul(
      'Everyone is an admin "for now". Temporary admin rights become permanent.',
      'Shared accounts. A login used by three people destroys your audit trail and cannot be revoked cleanly when one of them leaves.',
      'Roles by person. Fifteen custom permission sets for fifteen people is unmaintainable.',
      'No offboarding routine. When someone leaves, their access should end the same day. Keep a checklist.',
      'Forgetting derived access. Exports, reports and dashboards can reveal data the underlying table hides. Test every report as each role.',
    ),
    h2('A review checklist'),
    ol(
      'List all users and the role each one holds. Remove anyone who no longer needs access.',
      'Confirm the Administrator group has no more than two or three people.',
      'For each role, open the workspace as that role and try to see something you should not.',
      'Check that external users can only reach their own records.',
      'Verify that agent and integration accounts are read-only or tightly scoped.',
      'Make sure you can answer "who changed this record last week?" in under a minute.',
    ),
    p(
      'Do this review quarterly. Access control is not a one-time configuration; it is housekeeping, and like all housekeeping it is cheapest when done little and often.',
    ),
  ],
}
