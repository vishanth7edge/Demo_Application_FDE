import logoUrl from '../assets/logo.svg'

export interface LogoProps {
  className?: string | undefined
}

// Exported from the Figma "Product Empty Scenario" frame.
export function Logo({ className = 'h-12' }: LogoProps): React.JSX.Element {
  return (
    <img
      src={logoUrl}
      alt="Old Town Market"
      width={196}
      height={52}
      className={`w-auto ${className}`}
    />
  )
}
