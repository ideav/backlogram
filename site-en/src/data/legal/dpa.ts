import { LEGAL_CONFIG as C, OPERATOR } from './config'
import type { LegalDoc } from './types'

export const DPA: LegalDoc = {
  slug: 'dpa',
  title: 'Data Processing Addendum',
  short: 'Data Processing Addendum',
  description:
    'GDPR Article 28 data processing terms for Integram customers, with the Standard Contractual Clauses, the UK Addendum, CCPA service-provider terms and technical and organisational measures.',
  updated: C.updated,
  blocks: [
    {
      type: 'callout',
      text: `This Data Processing Addendum ("DPA") forms part of the [Terms of Service](/terms) (or other agreement) between the customer ("Customer") and ${OPERATOR} ("Integram") whenever Integram processes personal data on the Customer’s behalf. It applies automatically when Customer accepts the Terms; no signature is required. If you need a countersigned copy, contact ${C.privacyEmail}.`,
    },
    { type: 'h2', text: '1. Definitions and roles' },
    {
      type: 'ul',
      items: [
        '"Data Protection Laws" means all laws on the processing of personal data that apply to the processing under this DPA, including the EU General Data Protection Regulation 2016/679 ("GDPR"), the GDPR as retained in UK law ("UK GDPR") and the UK Data Protection Act 2018, the Swiss Federal Act on Data Protection, and US state privacy laws such as the California Consumer Privacy Act as amended ("CCPA").',
        '"Customer Personal Data" means personal data contained in workspace content that Integram processes for Customer under the Terms. Terms such as "controller", "processor", "data subject", "personal data breach" and "processing" have the meanings given in the GDPR.',
        'Customer is the controller (or a processor acting for its own controllers) and Integram is the processor (or sub-processor). For data Integram processes as a controller, such as account and billing data, the [Privacy Policy](/privacy) applies instead.',
      ],
    },
    { type: 'h2', text: '2. Processing on instructions' },
    {
      type: 'ul',
      items: [
        'Integram processes Customer Personal Data only on Customer’s documented instructions, including with regard to international transfers, unless required to do otherwise by law; in that case Integram informs Customer before processing unless the law prohibits it. The Terms, this DPA and Customer’s use and configuration of the Service are Customer’s complete instructions.',
        'Integram informs Customer promptly if, in its opinion, an instruction infringes Data Protection Laws.',
        'Customer is responsible for the lawfulness of the processing it instructs, including having a lawful basis and giving any required notices.',
      ],
    },
    { type: 'h2', text: '3. Confidentiality' },
    {
      type: 'p',
      text: 'Integram ensures that persons authorized to process Customer Personal Data are bound by confidentiality obligations and access the data only as needed to provide, secure and support the Service.',
    },
    { type: 'h2', text: '4. Security' },
    {
      type: 'p',
      text: 'Integram implements the technical and organisational measures described in Annex II to ensure a level of security appropriate to the risk, as required by Article 32 GDPR. Integram may update these measures as long as the overall level of security is not reduced.',
    },
    { type: 'h2', text: '5. Sub-processors' },
    {
      type: 'ul',
      items: [
        'Customer gives general authorization for Integram to engage the sub-processors listed on the [Sub-processors](/subprocessors) page (Annex III).',
        'Integram will notify Customer of any intended addition or replacement of a sub-processor at least 30 days in advance by updating that page and by email to the account owner. Customer may object on reasonable data protection grounds within that period; the parties will discuss the objection in good faith, and if it cannot be resolved Customer may terminate the affected Service and receive a refund of unused prepaid fees.',
        'Integram imposes on each sub-processor data protection obligations no less protective than those in this DPA, and remains responsible to Customer for its sub-processors’ performance.',
      ],
    },
    { type: 'h2', text: '6. Assistance with data subject requests' },
    {
      type: 'p',
      text: 'Taking into account the nature of the processing, Integram assists Customer by appropriate technical and organisational measures in responding to requests from data subjects. The Service lets Customer access, correct, export and delete workspace content itself. If Integram receives a request directly, it forwards it to Customer without undue delay and does not respond except to point the person to Customer, unless Customer authorizes it.',
    },
    { type: 'h2', text: '7. Personal data breaches' },
    {
      type: 'p',
      text: 'Integram notifies Customer without undue delay, and in any case within 48 hours, after becoming aware of a personal data breach affecting Customer Personal Data. The notice describes, as far as then known, the nature of the breach, the categories and approximate number of data subjects and records concerned, the likely consequences and the measures taken or proposed. Integram provides further information as it becomes available and takes reasonable steps to contain the breach.',
    },
    { type: 'h2', text: '8. Impact assessments and consultations' },
    {
      type: 'p',
      text: 'Integram provides reasonable assistance with data protection impact assessments and prior consultations with supervisory authorities that Customer is required to carry out, to the extent relating to Integram’s processing and the information is available to Integram.',
    },
    { type: 'h2', text: '9. Deletion and return' },
    {
      type: 'p',
      text: 'Customer can export its workspace content at any time during the subscription and for 30 days after it ends. After that period Integram deletes Customer Personal Data from its live systems, and from backups as they rotate out, unless Data Protection Laws or other applicable law require storage.',
    },
    { type: 'h2', text: '10. Audits and information' },
    {
      type: 'p',
      text: 'Integram makes available to Customer the information reasonably necessary to demonstrate compliance with Article 28 GDPR, starting with this DPA, its annexes and written answers to reasonable security questionnaires (no more than once a year unless a breach has occurred or a supervisory authority requires it). Where this is not sufficient, Customer may conduct an audit, including an inspection, by an independent auditor bound by confidentiality, with at least 30 days’ notice, during business hours, at Customer’s cost and without access to other customers’ data.',
    },
    { type: 'h2', text: '11. International transfers' },
    {
      type: 'ul',
      items: [
        'Integram does not transfer Customer Personal Data outside the location where the Service is hosted (Annex III) except to the sub-processors listed there, or as Customer instructs.',
        '**EU Standard Contractual Clauses.** To the extent Customer Personal Data subject to the GDPR is transferred to a country without an adequacy decision, the Standard Contractual Clauses adopted by Commission Implementing Decision (EU) 2021/914 ("SCCs") are incorporated by reference: Module Two (controller to processor) where Customer is a controller, and Module Three (processor to processor) where Customer is a processor. For the SCCs: clause 7 (docking) applies; under clause 9 option 2 (general authorization) applies with the notice period in section 5; the optional language in clause 11 does not apply; clauses 17 and 18 are governed by and subject to the law and courts of an EU member state chosen by the parties, which is ' + C.governingLaw + ' if that is the law of an EU member state, and otherwise the law and courts of the member state where Customer is established (or, if Customer is not established in the EU, where its EU representative is located). Annexes I to III of this DPA complete the annexes of the SCCs.',
        '**UK.** For transfers subject to the UK GDPR, the International Data Transfer Addendum to the EU SCCs issued by the UK Information Commissioner (version B1.0, in force 21 March 2022) is incorporated, with the information in Tables 1 to 3 taken from this DPA and its annexes; for Table 4 either party may end the Addendum as set out in its section 19.',
        '**Switzerland.** For transfers subject to Swiss law, the SCCs apply with the Swiss Federal Data Protection and Information Commissioner as competent authority and references to the GDPR read as references to the Swiss Federal Act on Data Protection.',
        'If a transfer mechanism is invalidated, the parties will cooperate in good faith to put an alternative lawful mechanism in place.',
      ],
    },
    { type: 'h2', text: '12. CCPA service provider terms' },
    {
      type: 'p',
      text: 'To the extent Customer Personal Data is "personal information" under the CCPA or similar US state laws, Integram acts as a "service provider" or "processor" and:',
    },
    {
      type: 'ul',
      items: [
        'processes it only for the limited and specified business purpose of providing the Service under the Terms;',
        'does not sell or share it (as those terms are defined in the CCPA) and does not use it for cross-context behavioral advertising;',
        'does not retain, use or disclose it outside the direct business relationship with Customer or for any purpose other than the business purposes specified in the Terms, except as the CCPA permits;',
        'does not combine it with personal information received from or on behalf of other persons, except as the CCPA permits;',
        'complies with the CCPA and provides the same level of privacy protection it requires, and notifies Customer if it can no longer meet its obligations;',
        'grants Customer the right to take reasonable and appropriate steps to stop and remediate unauthorized use of the personal information.',
      ],
    },
    { type: 'h2', text: '13. Liability and precedence' },
    {
      type: 'p',
      text: 'Each party’s liability under this DPA is subject to the limitations in the Terms, except where the SCCs or Data Protection Laws do not allow it. If this DPA conflicts with the Terms, this DPA prevails for the processing of Customer Personal Data; if it conflicts with the SCCs, the SCCs prevail.',
    },
    { type: 'h2', text: 'Annex I: Parties and description of the processing' },
    {
      type: 'table',
      head: ['Item', 'Details'],
      rows: [
        ['Data exporter', 'Customer, as identified in its account. Role: controller (or processor). Contact: the account owner’s email.'],
        ['Data importer', `${OPERATOR}. Role: processor (or sub-processor). Contact: ${C.privacyEmail}.`],
        ['Categories of data subjects', 'Determined by Customer. Typically Customer’s employees, contractors and users of its workspaces, and its own customers, suppliers, leads and other business contacts whose data Customer puts into its workspaces.'],
        ['Categories of personal data', 'Determined by Customer. Typically names, business contact details, job details, records of transactions, orders, tasks and communications, files Customer uploads, and user activity logs within the workspace.'],
        ['Special categories of data', 'Not intended. Customer must not upload special categories of personal data unless it has assessed that the measures in Annex II are appropriate and the processing is lawful.'],
        ['Frequency of transfer', 'Continuous, for as long as Customer uses the Service.'],
        ['Nature of the processing', 'Hosting, storage, backup, retrieval, structuring, display, export, deletion, and transmission to integrations and AI agents that Customer connects.'],
        ['Purpose', 'Providing, securing and supporting the Service under the Terms.'],
        ['Duration and retention', 'The term of the Terms plus the 30-day export period, then deletion as in section 9.'],
        ['Sub-processor transfers', 'As listed in Annex III, for the same nature and purpose, for the duration of the Terms.'],
        ['Competent supervisory authority', 'Determined in accordance with clause 13 of the SCCs: the authority of the EU member state where Customer is established or, if Customer is not established in the EU, where its EU representative is located.'],
      ],
    },
    { type: 'h2', text: 'Annex II: Technical and organisational measures' },
    {
      type: 'p',
      text: 'These are the measures in place today. Integram does not currently hold certifications such as ISO 27001 or SOC 2 and does not claim them.',
    },
    {
      type: 'table',
      head: ['Area', 'Measures'],
      rows: [
        ['Encryption in transit', 'All traffic to the website, app, REST API and MCP server is served over HTTPS (TLS); HTTP requests are redirected to HTTPS and HSTS is enabled.'],
        ['Authentication', 'Passwords are never stored in plain text: only salted one-way hashes are kept. Email sign-up requires confirming the address. Optional sign-in with GitHub or Google uses OAuth with state checks against request forgery. Logging out ends the session.'],
        ['Access control within the Service', 'Each workspace has its own database. Inside a workspace, access to tables, records and functions is controlled by roles that the workspace owner configures. API and MCP access acts with the permissions of the token used.'],
        ['Administrative access', 'Access to production servers is limited to a small number of authorized personnel, over SSH with key-based authentication. Secrets and configuration are kept in server-only files that are not part of the code repository.'],
        ['Abuse prevention', 'Rate limits and honeypot checks on sign-up, login and contact forms; optional bot protection.'],
        ['Availability and backups', `Backups of databases and uploaded files: ${C.backups}.`],
        ['Logging', 'Web server and application logs record requests and errors for security monitoring and troubleshooting, kept for ' + C.logRetention + '.'],
        ['Secure development', 'Changes are reviewed and pass automated tests before release; releases are deployed by script, never by editing production by hand; secrets are excluded from releases.'],
        ['Data minimisation', 'The marketing site sets no advertising trackers and loads cookieless analytics only with consent. Customer Data is not used to train AI models.'],
        ['Incident response', 'Suspected incidents are investigated and contained, and affected customers are notified as described in section 7.'],
        ['Personnel', 'Personnel with access are bound by confidentiality obligations.'],
      ],
    },
    { type: 'h2', text: 'Annex III: Sub-processors' },
    {
      type: 'p',
      text: 'The list of authorized sub-processors, their location and purpose is maintained on the [Sub-processors](/subprocessors) page and forms part of this DPA.',
    },
  ],
}
