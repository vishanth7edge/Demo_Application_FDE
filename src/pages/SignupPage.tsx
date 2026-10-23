import { useState } from 'react'
import { Link } from 'react-router'

import { AuthFormHeading } from '../components/AuthFormHeading.tsx'
import { Button } from '../components/Button.tsx'
import { Input } from '../components/Input.tsx'
import { PRIVACY_URL, TERMS_URL } from '../helpers/siteLinks.ts'
import { hasErrors, validateSignupForm } from '../helpers/validators.ts'

import type { FormErrors, SignupValues } from '../helpers/validators.ts'

export type SignupPageProps = Record<string, never>

const INITIAL_VALUES: SignupValues = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
}

export function SignupPage(): React.JSX.Element {
  const [values, setValues] = useState<SignupValues>(INITIAL_VALUES)
  const [errors, setErrors] = useState<FormErrors<keyof SignupValues>>({})

  const field = (
    name: keyof SignupValues,
  ): { value: string; error: string | undefined; onChange: (value: string) => void } => ({
    value: values[name],
    error: errors[name],
    onChange: (value: string): void => {
      setValues((current) => ({ ...current, [name]: value }))
      // Clear only this field's error; the others stay until the next submit.
      setErrors(({ [name]: _cleared, ...rest }) => rest)
    },
  })

  const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const nextErrors = validateSignupForm(values)
    setErrors(nextErrors)
    if (hasErrors(nextErrors)) {
      return
    }
    // TODO: call the signup API once it exists.
  }

  return (
    <section className="flex flex-col gap-8">
      <AuthFormHeading
        eyebrow="Sign up"
        title="Create your account"
        description="Start building your business with Old Town Market."
      />
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input
          label="First name"
          name="firstName"
          autoComplete="given-name"
          placeholder="Enter your first name"
          {...field('firstName')}
        />
        <Input
          label="Last name"
          name="lastName"
          autoComplete="family-name"
          placeholder="Enter your last name"
          {...field('lastName')}
        />
        <Input
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          {...field('email')}
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Create a password"
          {...field('password')}
        />
        <Input
          label="Confirm password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          {...field('confirmPassword')}
        />
        <Button type="submit" className="mt-1 w-full">
          Create account
        </Button>
        <p className="text-center text-body-small text-on-surface-muted">
          By continuing, you agree to our{' '}
          <a href={TERMS_URL} className="text-brand hover:underline">
            Terms of service
          </a>{' '}
          and{' '}
          <a href={PRIVACY_URL} className="text-brand hover:underline">
            Privacy policy
          </a>
          .
        </p>
      </form>
      <p className="border-t border-outline pt-6 text-center text-body-medium">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-brand hover:underline">
          Log in
        </Link>
      </p>
    </section>
  )
}
