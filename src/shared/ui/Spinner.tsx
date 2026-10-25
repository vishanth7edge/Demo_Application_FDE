export interface SpinnerProps {
  /** Announced to screen readers. Pass `null` when a visible label already says it. */
  label?: string | null
  className?: string
}

export function Spinner({
  label = 'Loading',
  className = 'size-5',
}: SpinnerProps): React.JSX.Element {
  return (
    <span className="inline-flex items-center" role={label === null ? undefined : 'status'}>
      <svg
        className={`animate-spin ${className}`}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      {label === null ? null : <span className="sr-only">{label}</span>}
    </span>
  )
}

export interface FullPageSpinnerProps {
  label?: string
}

export function FullPageSpinner({ label = 'Loading' }: FullPageSpinnerProps): React.JSX.Element {
  return (
    <div className="flex min-h-[60vh] items-center justify-center text-brand">
      <Spinner label={label} className="size-8" />
    </div>
  )
}
