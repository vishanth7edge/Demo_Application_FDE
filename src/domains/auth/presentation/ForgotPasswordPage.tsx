import { Link } from 'react-router'

import { AuthShell } from '../../../shared/layout/AuthShell.tsx'
import { Alert } from '../../../shared/ui/Alert.tsx'
import { Button } from '../../../shared/ui/Button.tsx'
import { buttonClasses } from '../../../shared/ui/buttonStyles.ts'
import { TextField } from '../../../shared/ui/TextField.tsx'
import { useForgotPasswordForm } from './useForgotPasswordForm.ts'

export type ForgotPasswordPageProps = Record<string, never>

export function ForgotPasswordPage(_props: ForgotPasswordPageProps): React.JSX.Element {
  const { email, error, formError, confirmation, submitting, handleChange, handleSubmit } =
    useForgotPasswordForm()

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter the email address you use for Buggy Store and we'll send you a reset link."
      footer={
        <Link to="/login" className="font-medium text-brand hover:underline">
          ← Back to sign in
        </Link>
      }
    >
      {confirmation === null ? (
        <div className="space-y-5">
          {formError === null ? null : <Alert tone="error">{formError}</Alert>}
          <form noValidate onSubmit={handleSubmit} className="space-y-5">
            <TextField
              label="Email address"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="name@company.com"
              required
              value={email}
              onChange={handleChange}
              error={error}
            />
            <Button type="submit" loading={submitting} className="w-full">
              {submitting ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>
        </div>
      ) : (
        <div className="space-y-5">
          <Alert tone="success" title="Check your inbox">
            {confirmation}
          </Alert>
          <p className="text-sm text-slate-500">
            This is a demo environment: no email is actually sent.
          </p>
          <Link to="/login" className={`${buttonClasses('secondary')} w-full`}>
            Return to sign in
          </Link>
        </div>
      )}
    </AuthShell>
  )
}
