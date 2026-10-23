import { Outlet } from 'react-router'

import authIllustration from '../../assets/auth-illustration.jpg'
import { PRIVACY_URL, SUPPORT_URL, TERMS_URL } from '../../helpers/siteLinks.ts'
import { CheckIcon, ExternalLinkIcon } from '../icons/UiIcons.tsx'
import { Logo } from '../Logo.tsx'

const HIGHLIGHTS = [
  'A home for your products',
  'Orders and vendors, in sync',
  'Simple tools for everyday business',
] as const

const CURRENT_YEAR = new Date().getFullYear()

export type AuthLayoutProps = Record<string, never>

// Layout route for /login and /signup: top bar, marketing panel (lg and up), form, footer.
export function AuthLayout(): React.JSX.Element {
  return (
    <div className="flex min-h-dvh flex-col bg-surface font-poppins text-on-surface">
      <header className="flex items-center justify-between gap-4 px-4 py-4 sm:px-8">
        <Logo />
        <p className="text-right text-body-small">
          Need a hand?{' '}
          <a
            href={SUPPORT_URL}
            className="inline-flex items-center gap-1 font-medium text-brand hover:underline"
          >
            Contact support
            <ExternalLinkIcon className="size-4" />
          </a>
        </p>
      </header>

      <div className="flex flex-1 gap-8 px-4 pb-4 sm:px-8">
        <aside className="hidden w-full max-w-xl flex-col justify-center gap-6 rounded-3xl bg-surface-muted p-10 lg:flex">
          <span className="self-start rounded-md bg-sidebar-active px-3 py-1.5 text-label-small text-brand uppercase">
            Your business, better connected
          </span>
          <p className="text-display-small font-medium">
            Big possibilities.
            <br />
            One simple place.
          </p>
          <p className="text-body-large text-on-surface-muted">
            Bring your products, orders and vendors together. Make room for what&apos;s next.
          </p>
          {/* Decorative: the heading and highlights carry the meaning. */}
          <img
            src={authIllustration}
            alt=""
            width={1376}
            height={768}
            className="aspect-[504/290] w-full rounded-lg object-cover"
          />
          <ul className="flex flex-col gap-4">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-center gap-3 text-body-medium">
                <span className="flex size-6 items-center justify-center rounded-full bg-sidebar-active text-brand">
                  <CheckIcon className="size-4" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </aside>

        <main className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-sm">
            <Outlet />
          </div>
        </main>
      </div>

      <footer className="flex flex-col gap-2 px-4 py-4 text-body-small text-on-surface-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>© {CURRENT_YEAR} Old Town Market. All rights reserved.</p>
        <nav aria-label="Legal" className="flex gap-6">
          <a href={PRIVACY_URL} className="hover:text-on-surface hover:underline">
            Privacy policy
          </a>
          <a href={TERMS_URL} className="hover:text-on-surface hover:underline">
            Terms of service
          </a>
        </nav>
      </footer>
    </div>
  )
}
