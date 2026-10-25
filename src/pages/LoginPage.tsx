import { useState } from 'react'
import { Link, useNavigate } from 'react-router'

import { useAuth } from '../components/auth/useAuth.ts'
import Input from '../components/Input.tsx'
import {
  type FormErrors,
  hasErrors,
  type LoginValues,
  validateLoginForm,
} from '../helpers/validators.ts'
import { login } from '../services/authService.ts'
import AuthLayout from '../shared/AuthLayout.tsx'
import AuthShowcase from '../components/auth/AuthShowcase.tsx'

const NO_ERRORS: FormErrors<LoginValues> = { username: null, password: null }

export default function LoginPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [values, setValues] = useState<LoginValues>({ username: '', password: '' })
  const [errors, setErrors] = useState<FormErrors<LoginValues>>(NO_ERRORS)
  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleChange = (field: keyof LoginValues, value: string): void => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: null }))
  }

  const submitLogin = async (): Promise<void> => {
    setIsLoading(true)
    setSubmitError(null)
    const result = await login(values)
    setIsLoading(false)
    if (result.error) {
      setSubmitError(result.message)
      return
    }
    signIn(result.data.username)
    void navigate('/dashboard')
  }

  const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault()
    if (isLoading) {
      return
    }
    const nextErrors = validateLoginForm(values)
    setErrors(nextErrors)
    if (!hasErrors(nextErrors)) {
      void submitLogin()
    }
  }

  return (
    <AuthLayout>
      <AuthShowcase />
      <main className="mx-auto flex w-full max-w-sm flex-col justify-center gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-label-small text-primary">WELCOME BACK</p>
          <h1 className="text-headline-small font-medium text-on-surface">
            Log in to Old Town Market
          </h1>
          <p className="text-body-medium text-on-surface-variant">
            Your business is right where you left it. Enter your details to pick up where you
            stopped.
          </p>
        </div>
        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Username"
            name="username"
            type="text"
            autoComplete="username"
            value={values.username}
            error={errors.username}
            onChange={(value) => {
              handleChange('username', value)
            }}
          />
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={values.password}
            error={errors.password}
            onChange={(value) => {
              handleChange('password', value)
            }}
          />
          {submitError !== null && (
            <p
              role="alert"
              className="rounded-md bg-error-container p-3 text-body-medium text-on-error-container"
            >
              {submitError}
            </p>
          )}
          <button
            type="submit"
            disabled={isLoading}
            aria-busy={isLoading}
            className="rounded-lg bg-primary px-4 py-3 text-label-large text-on-primary hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60"
          >
            {isLoading ? 'Logging in…' : 'Log in'}
          </button>
        </form>
        <p className="border-t border-outline-variant pt-4 text-center text-body-medium text-on-surface-variant">
          New to Old Town Market?{' '}
          <Link to="/signup" className="font-medium text-primary">
            Sign up
          </Link>
        </p>
      </main>
    </AuthLayout>
  )
}
