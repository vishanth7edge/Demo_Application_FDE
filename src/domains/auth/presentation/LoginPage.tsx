import { Link } from 'react-router'

import { AuthShell } from '../../../shared/layout/AuthShell.tsx'
import { Alert } from '../../../shared/ui/Alert.tsx'
import { Button } from '../../../shared/ui/Button.tsx'
import { TextField } from '../../../shared/ui/TextField.tsx'
import { PasswordField } from './PasswordField.tsx'
import { useLoginForm } from './useLoginForm.ts'

export type LoginPageProps = Record<string, never>

export function LoginPage(_props: LoginPageProps): React.JSX.Element {
  const { values, errors, formError, notice, submitting, handleChange, handleSubmit } =
    useLoginForm()

  return (
    <AuthShell
      title="Sign in to Buggy Store"
      subtitle="Manage your product catalogue and inventory."
    >
      <div className="space-y-5">
        {notice === null || formError !== null ? null : <Alert tone="info">{notice}</Alert>}
        {formError === null ? null : <Alert tone="error">{formError}</Alert>}

        <form noValidate onSubmit={handleSubmit} className="space-y-5">
          <TextField
            label="Email address"
            type="text"
            inputMode="email"
            name="email"
            autoComplete="username"
            placeholder="name@company.com"
            required
            value={values.email}
            onChange={handleChange('email')}
            error={errors.email}
          />
          <PasswordField
            label="Password"
            name="password"
            autoComplete="current-password"
            required
            value={values.password}
            onChange={handleChange('password')}
            error={errors.password}
            aside={
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-brand hover:underline"
              >
                Forgot password?
              </Link>
            }
          />
          <Button type="submit" loading={submitting} className="w-full">
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </AuthShell>
  )
}
