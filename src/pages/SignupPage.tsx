import { useState } from 'react'
import { Link, useNavigate } from 'react-router'

import AuthShowcase from '../components/auth/AuthShowcase.tsx'
import Input from '../components/Input.tsx'
import {
  type FormErrors,
  hasErrors,
  type SignupValues,
  validateSignupForm,
} from '../helpers/validators.ts'
import AuthLayout from '../shared/AuthLayout.tsx'

const NO_ERRORS: FormErrors<SignupValues> = {
  name: null,
  email: null,
  password: null,
  confirmPassword: null,
}

export default function SignupPage(): React.JSX.Element {
  const navigate = useNavigate()
  const [values, setValues] = useState<SignupValues>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<FormErrors<SignupValues>>(NO_ERRORS)

  const handleChange = (field: keyof SignupValues, value: string): void => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: null }))
  }

  const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const nextErrors = validateSignupForm(values)
    setErrors(nextErrors)
    if (!hasErrors(nextErrors)) {
      void navigate('/login')
    }
  }

  return (
    <AuthLayout>
      <AuthShowcase />
      <main className="mx-auto flex w-full max-w-sm flex-col justify-center gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-label-small text-primary">SIGN UP</p>
          <h1 className="text-headline-small font-medium text-on-surface">Create your account</h1>
          <p className="text-body-medium text-on-surface-variant">
            Start building your business with Old Town Market. All you need is a few details.
          </p>
        </div>
        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Name"
            name="name"
            type="text"
            autoComplete="name"
            value={values.name}
            error={errors.name}
            onChange={(value) => {
              handleChange('name', value)
            }}
          />
          <Input
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            error={errors.email}
            onChange={(value) => {
              handleChange('email', value)
            }}
          />
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={values.password}
            error={errors.password}
            onChange={(value) => {
              handleChange('password', value)
            }}
          />
          <Input
            label="Confirm password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={values.confirmPassword}
            error={errors.confirmPassword}
            onChange={(value) => {
              handleChange('confirmPassword', value)
            }}
          />
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-3 text-label-large text-on-primary hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Sign up
          </button>
        </form>
        <p className="text-center text-body-small text-on-surface-variant">
          By continuing, you agree to our{' '}
          <a href="#" className="text-primary">
            Terms of service
          </a>{' '}
          and{' '}
          <a href="#" className="text-primary">
            Privacy policy
          </a>
          .
        </p>
        <p className="border-t border-outline-variant pt-4 text-center text-body-medium text-on-surface-variant">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary">
            Log in
          </Link>
        </p>
      </main>
    </AuthLayout>
  )
}
