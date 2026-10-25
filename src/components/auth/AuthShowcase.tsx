import { CheckIcon } from '../Icons.tsx'

const FEATURES = [
  'A home for your products',
  'Orders and vendors, in sync',
  'Simple tools for everyday business',
]

export default function AuthShowcase(): React.JSX.Element {
  return (
    <section className="hidden flex-col justify-between gap-6 rounded-3xl bg-primary-95 p-8 md:flex">
      <div className="flex flex-col gap-4">
        <span className="w-fit rounded-full bg-primary-90/60 px-3 py-1 text-label-small font-normal text-primary-30">
          YOUR BUSINESS, BETTER CONNECTED
        </span>
        <h2 className="text-display-small font-medium text-on-surface">
          Big possibilities.
          <br />
          One simple place.
        </h2>
        <p className="max-w-sm text-body-large text-on-surface-variant">
          Bring your products, orders and vendors together. Make room for what&apos;s next.
        </p>
      </div>
      <img src="/login-illustration.svg" alt="" className="w-full rounded-lg" />
      <ul className="flex flex-col gap-3">
        {FEATURES.map((text) => (
          <li key={text} className="flex items-center gap-3 text-body-medium text-on-surface">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-90 text-primary">
              <CheckIcon size={12} />
            </span>
            {text}
          </li>
        ))}
      </ul>
    </section>
  )
}
