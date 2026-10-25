import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react'

import { buttonClasses } from './buttonStyles.ts'
import type { ButtonSize, ButtonVariant } from './buttonStyles.ts'
import { Spinner } from './Spinner.tsx'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Shows a spinner, sets aria-busy and blocks further clicks. */
  loading?: boolean
  icon?: ReactNode
  ref?: Ref<HTMLButtonElement>
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  disabled,
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps): React.JSX.Element {
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled === true || loading}
      aria-busy={loading || undefined}
      className={`${buttonClasses(variant, size)} ${className}`}
    >
      {loading ? <Spinner label={null} className="size-4" /> : icon}
      {children}
    </button>
  )
}
