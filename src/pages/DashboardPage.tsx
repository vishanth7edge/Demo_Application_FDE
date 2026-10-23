import { useAuth } from '../context/useAuth.ts'

export type DashboardPageProps = Record<string, never>

export function DashboardPage(): React.JSX.Element {
  const { user } = useAuth()

  return (
    <section className="flex flex-col gap-2">
      <h1 className="font-poppins text-headline-small font-semibold">Dashboard</h1>
      <p className="text-body-large text-on-surface-muted">Welcome, {user?.firstName}!</p>
    </section>
  )
}
