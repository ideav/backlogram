import type { ComponentType } from 'react'
import { Layout } from './components/Layout'

export type PageComponent = ComponentType<{ slug?: string }>

/** Shared shell for prerendering and hydration: same tree on both sides. */
export function App({ path, Page, slug }: { path: string; Page: PageComponent; slug?: string }) {
  return (
    <Layout path={path}>
      <Page slug={slug} />
    </Layout>
  )
}
