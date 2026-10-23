import { Link } from 'react-router'

export type NotFoundPageProps = Record<string, never>

export function NotFoundPage(): React.JSX.Element {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-6 py-16 font-sans text-slate-800">
      <h1 className="text-headline-medium font-semibold">Page not found</h1>
      <p className="text-slate-600">
        The page you are looking for does not exist.{' '}
        <Link to="/login" className="font-medium text-brand underline">
          Go to login
        </Link>
      </p>
    </main>
  )
}
