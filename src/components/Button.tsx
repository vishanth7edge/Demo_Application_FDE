import { buttonClasses } from './fieldStyles.ts'

import type { ButtonVariant } from './fieldStyles.ts'

export interface ButtonProps extends Omit<React.ComponentProps<'button'>, 'className' | 'type'> {
  variant?: ButtonVariant | undefined
  type?: 'button' | 'submit' | undefined
  // Shown before the label.
  icon?: React.ReactNode
  className?: string | undefined
}

export function Button({
  variant = 'primary',
  type = 'button',
  icon,
  className = '',
  children,
  ...rest
}: ButtonProps): React.JSX.Element {
  return (
    <button {...rest} type={type} className={`${buttonClasses(variant)} ${className}`}>
      {icon}
      {children}
    </button>
  )
}
