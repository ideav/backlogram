import type { KbArticle } from '../types'
import { article as excelToWebApp } from './excel-to-web-app'
import { article as relationalVsSpreadsheets } from './relational-vs-spreadsheets'
import { article as accessControl } from './access-control'
import { article as aiAgentsMcp } from './ai-agents-mcp'
import { article as outgrowAirtable } from './outgrow-airtable'
import { article as dataOwnership } from './data-ownership'
import { article as pricingModels } from './pricing-models'
import { article as spreadsheetLimits } from './spreadsheet-limits'
import { article as formsAndReports } from './forms-and-reports'
import { article as notionAsDatabase } from './notion-as-database'

export const articles: KbArticle[] = [
  excelToWebApp,
  relationalVsSpreadsheets,
  accessControl,
  aiAgentsMcp,
  outgrowAirtable,
  dataOwnership,
  pricingModels,
  spreadsheetLimits,
  formsAndReports,
  notionAsDatabase,
]
