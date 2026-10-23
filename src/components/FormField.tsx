import { useId } from 'react'

export interface FieldControlProps {
  id: string
  'aria-invalid': boolean
  'aria-describedby': string | undefined
}

export interface FormFieldProps {
  label: string
  error?: string | undefined
  // Renders the control; spread the given props onto it so the label and error are linked.
  children: (control: FieldControlProps) => React.ReactNode
}

export function FormField({ label, error, children }: FormFieldProps): React.JSX.Element {
  const id = useId()
  const errorId = `${id}-error`
  const hasError = error !== undefined

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-label-large font-medium">
        {label}
      </label>
      {children({
        id,
        'aria-invalid': hasError,
        'aria-describedby': hasError ? errorId : undefined,
      })}
      {hasError && (
        <p id={errorId} className="text-body-small text-error">
          {error}
        </p>
      )}
    </div>
  )
}
