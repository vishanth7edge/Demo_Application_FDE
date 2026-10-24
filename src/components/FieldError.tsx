export interface FieldErrorProps {
  id: string
  message: string
}

export default function FieldError({ id, message }: FieldErrorProps): React.JSX.Element {
  return (
    <p id={id} className="text-body-small text-error">
      {message}
    </p>
  )
}
