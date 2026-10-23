import { useMatches } from 'react-router'

import { EmptyState } from '../components/EmptyState.tsx'
import { getRouteTitle } from '../helpers/routeTitle.ts'

export type ComingSoonPageProps = Record<string, never>

// Placeholder for menu pages that are not built yet. The title comes from the route's handle.
export function ComingSoonPage(): React.JSX.Element {
  const title = getRouteTitle(useMatches()) ?? 'Coming soon'

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-headline-small font-semibold">{title}</h1>
      <EmptyState title="Coming soon" description="This page is not built yet." />
    </section>
  )
}
