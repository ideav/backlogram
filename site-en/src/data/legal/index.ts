import { COOKIES } from './cookies'
import { DPA } from './dpa'
import { ACCEPTABLE_USE, COPYRIGHT, SECURITY } from './policies'
import { PRIVACY } from './privacy'
import { SUBPROCESSORS } from './subprocessors'
import { TERMS } from './terms'
import type { LegalDoc, LegalSlug } from './types'

export type { LegalBlock, LegalDoc, LegalSlug } from './types'
export { LEGAL_CONFIG } from './config'

/**
 * The legal pack of the English site (issues #524, #531): one prerendered page
 * per document, in this order in the footer "Legal" column and the sitemap.
 * Operator details are build-time configuration, see ./config.ts.
 */
export const LEGAL: LegalDoc[] = [TERMS, PRIVACY, COOKIES, DPA, SUBPROCESSORS, ACCEPTABLE_USE, COPYRIGHT, SECURITY]

export const LEGAL_SLUGS: LegalSlug[] = LEGAL.map((d) => d.slug)
