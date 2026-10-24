import { useState } from 'react'
import { Link, useNavigate } from 'react-router'

import Input from '../components/Input.tsx'
import {
  type FormErrors,
  hasErrors,
  type SignupValues,
  validateSignupForm,
} from '../helpers/validators.ts'

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
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-6">
      <h1 className="text-headline-medium text-on-surface">Sign up</h1>
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
          className="rounded-md bg-primary px-4 py-2 text-label-large text-on-primary hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Sign up
        </button>
      </form>
      <p className="text-body-medium text-on-surface-variant">
        Already have an account?{' '}
        <Link to="/login" className="text-primary underline">
          Log in
        </Link>
      </p>
    </main>
  )
}
