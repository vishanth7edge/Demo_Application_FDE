import { useState } from 'react'
import type { ChangeEvent, SubmitEvent } from 'react'

import { validateLoginInput } from '../application/index.ts'
import type { LoginFieldErrors, LoginInput } from '../application/index.ts'
import { useAuth } from './useAuth.ts'

export interface LoginForm {
  values: LoginInput
  errors: LoginFieldErrors
  formError: string | null
  notice: string | null
  submitting: boolean
  handleChange: (field: keyof LoginInput) => (event: ChangeEvent<HTMLInputElement>) => void
  handleSubmit: (event: SubmitEvent<HTMLFormElement>) => void
}

export function useLoginForm(): LoginForm {
  const { signIn, notice } = useAuth()
  const [values, setValues] = useState<LoginInput>({ email: '', password: '' })
  const [errors, setErrors] = useState<LoginFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleChange =
    (field: keyof LoginInput) =>
    (event: ChangeEvent<HTMLInputElement>): void => {
      const { value } = event.target
      setValues((current) => ({ ...current, [field]: value }))
      setErrors((current) => {
        const { [field]: _removed, ...rest } = current
        return rest
      })
    }

  const submit = async (): Promise<void> => {
    const fieldErrors = validateLoginInput(values)
    setErrors(fieldErrors)
    setFormError(null)
    if (Object.keys(fieldErrors).length > 0) {
      return
    }
    setSubmitting(true)
    const result = await signIn(values)
    setSubmitting(false)
    if (result.error) {
      setFormError(result.message)
    }
    // On success the auth state changes and RedirectIfAuthenticated moves on from /login.
  }

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>): void => {
    event.preventDefault()
    if (!submitting) {
      void submit()
    }
  }

  return { values, errors, formError, notice, submitting, handleChange, handleSubmit }
}
