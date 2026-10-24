const VARIANT_CLASSES = {
  primary: 'bg-primary text-on-primary hover:opacity-90',
  outlined: 'border border-primary bg-transparent text-primary hover:bg-primary-container',
  danger: 'border border-error bg-transparent text-error hover:bg-error-container',
} as const

export type ButtonVariant = keyof typeof VARIANT_CLASSES

export interface ButtonProps {
  children: React.ReactNode
  onClick?: (() => void) | undefined
  variant?: ButtonVariant
  type?: 'button' | 'submit'
  disabled?: boolean
  fullWidth?: boolean
}

export default function Button({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  disabled = false,
  fullWidth = false,
}: ButtonProps): React.JSX.Element {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-label-large focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60 ${VARIANT_CLASSES[variant]} ${fullWidth ? 'w-full' : ''}`}
    >
      {children}
    </button>
  )
}
