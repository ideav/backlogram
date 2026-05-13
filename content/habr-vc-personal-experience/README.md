# Habr/VC Personal-Experience Pipeline

This directory is an editorial staging area for turning knowledge-base articles
into first-person publication drafts for Habr and VC.ru. It is intentionally
separate from `src/data/knowledgeBase.ts`: drafts here are not rendered on the
site until they are reviewed and published through the blog/content workflow.

## Scope

The pipeline tracks 18 canonical knowledge-base articles:

- articles `01` through `16`;
- the split article `14` series as `14`, `14a`, and `14b`;
- without supplemental article `08a`, which was created as an internal
  knowledge-base follow-up rather than part of the original 18-article set.

## Workflow

1. Take the source page from `src/data/knowledgeBase.ts` and the upstream
   review markdown from `ideav/crm/docs/integram-article-reviews`.
2. Reframe the comparison article as a first-person story: concrete situation,
   what was tried, what broke, what changed after using the platform.
3. Keep product claims modest and fact-checkable. Avoid naming a specific
   AI-code tool unless the author has direct measured evidence.
4. Add platform notes for Habr and VC.ru: possible title, lead, tags, screenshots,
   and fact-check items.
5. Move the draft through `planned` -> `draft` -> `author_review` -> `ready`.

The first draft in this pipeline is article `11-ai-interface-data-safety`, now
assigned to author review.
