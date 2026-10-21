import { Link } from 'react-router'

export default function NotFoundPage(): React.JSX.Element {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-6">
      <h1 className="text-headline-medium text-on-surface">Page not found</h1>
      <p className="text-body-medium text-on-surface-variant">
        <Link to="/login" className="text-primary underline">
          Back to log in
        </Link>
      </p>
    </main>
  )
}
