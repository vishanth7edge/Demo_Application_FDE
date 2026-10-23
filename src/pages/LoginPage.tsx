import { useState , useEffect} from 'react'
import { Link, useNavigate } from 'react-router'

import { Input } from '../components/Input.tsx'
import { useAuth } from '../context/useAuth.ts'
import { hasErrors, validateLoginForm } from '../helpers/validators.ts'

import type { FormErrors, LoginValues } from '../helpers/validators.ts'

export type LoginPageProps = Record<string, never>

const INITIAL_VALUES: LoginValues = { username: '', password: '' }

export function LoginPage(): React.JSX.Element {
  const [values, setValues] = useState<LoginValues>(INITIAL_VALUES)
  const [errors, setErrors] = useState<FormErrors<keyof LoginValues>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { login } = useAuth()
 
  const [valuess, setValuess] = useState<number>(0)

    useEffect(() => {
      setValuess(prev=>prev+1)
    }, [valuess])
    
  const handleChange =
    (field: keyof LoginValues) =>
    (value: string): void => {
      setValues((current) => ({ ...current, [field]: value }))
      // Clear only this field's error; the others stay until the next submit.
      setErrors(({ [field]: _cleared, ...rest }) => rest)
    }

  const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>): void => {
    event.preventDefault()
    if (isSubmitting) {
      return
    }
    const nextErrors = validateLoginForm(values)
    setErrors(nextErrors)
    if (hasErrors(nextErrors)) {
      return
    }
    void submit()
  }

  const submit = async (): Promise<void> => {
    setIsSubmitting(true)
    setSubmitError(null)
    const result = await login(values)
    if (result.error) {
      setSubmitError(result.message)
      setIsSubmitting(false)
      return
    }
    void navigate('/dashboard')
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-16 font-sans text-slate-800">
      <h1 className="text-headline-medium font-semibold">Log in</h1>
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
        {submitError !== null && (
          <p
            role="alert"
            className="rounded-md border border-error px-3 py-2 text-body-medium text-error"
          >
            {submitError}
          </p>
        )}
        <Input
          label="Username"
          name="username"
          autoComplete="username"
          value={values.username}
          onChange={handleChange('username')}
          error={errors.username}
          disabled={isSubmitting}
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={values.password}
          onChange={handleChange('password')}
          error={errors.password}
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-brand px-4 py-2 font-medium text-brand-foreground hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-wait disabled:opacity-60"
        >
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="text-slate-600">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="font-medium text-brand underline">
          Sign up
        </Link>
      </p>
    </main>
  )
}
