export interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col bg-surface font-poppins">
      <header className="flex items-center justify-between px-10 py-5">
        <img src="/old-town-logo.svg" alt="Old Town Market" className="h-12 w-auto" />
        <p className="text-body-small text-on-surface">
          Need a hand?{' '}
          <a href="#" className="font-medium text-primary">
            Contact support
          </a>
        </p>
      </header>

      <div className="grid flex-1 gap-10 px-8 pb-6 md:grid-cols-2">{children}</div>

      <footer className="flex items-center justify-between px-10 py-5 text-body-small text-on-surface-variant">
        <p>© 2026 Old Town Market. All rights reserved.</p>
        <nav aria-label="Legal" className="flex gap-6">
          <a href="#">Privacy policy</a>
          <a href="#">Terms of service</a>
        </nav>
      </footer>
    </div>
  )
}
