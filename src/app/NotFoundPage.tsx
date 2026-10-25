import { Link } from 'react-router'

import { AuthShell } from '../shared/layout/AuthShell.tsx'
import { buttonClasses } from '../shared/ui/buttonStyles.ts'

export type NotFoundPageProps = Record<string, never>

export function NotFoundPage(_props: NotFoundPageProps): React.JSX.Element {
  return (
    <AuthShell
      title="Page not found"
      subtitle="The page you're looking for doesn't exist or has moved."
    >
      <Link to="/dashboard" className={`${buttonClasses('primary')} w-full`}>
        Go to the dashboard
      </Link>
    </AuthShell>
  )
}
