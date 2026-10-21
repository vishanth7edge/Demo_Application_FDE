import { useState } from 'react'
import { Link, useNavigate } from 'react-router'

import Input from '../components/Input.tsx'
import {
  type FormErrors,
  hasErrors,
  type LoginValues,
  validateLoginForm,
} from '../helpers/validators.ts'
import { login } from '../services/authService.ts'

const NO_ERRORS: FormErrors<LoginValues> = { username: null, password: null }

export default function LoginPage(): React.JSX.Element {
  const navigate = useNavigate()
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
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-6">
      <h1 className="text-headline-medium text-on-surface">Log in</h1>
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
          className="rounded-md bg-primary px-4 py-2 text-label-large text-on-primary hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60"
        >
          {isLoading ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="text-body-medium text-on-surface-variant">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="text-primary underline">
          Sign up
        </Link>
      </p>
    </main>
  )
}
