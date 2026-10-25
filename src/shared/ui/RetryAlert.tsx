import { Alert } from './Alert.tsx'
import { Button } from './Button.tsx'

export interface RetryAlertProps {
  title: string
  message: string
  onRetry: () => void
}

/** Error alert for a failed load, with a "Try again" action. */
export function RetryAlert({ title, message, onRetry }: RetryAlertProps): React.JSX.Element {
  return (
    <Alert
      tone="error"
      title={title}
      action={
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      }
    >
      {message}
    </Alert>
  )
}
