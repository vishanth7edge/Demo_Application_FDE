import { useState } from 'react'
import type { ChangeEvent, SubmitEvent } from 'react'

import { requestPasswordReset, validateForgotPasswordEmail } from '../application/index.ts'

export interface ForgotPasswordForm {
  email: string
  error: string | undefined
  formError: string | null
  confirmation: string | null
  submitting: boolean
  handleChange: (event: ChangeEvent<HTMLInputElement>) => void
  handleSubmit: (event: SubmitEvent<HTMLFormElement>) => void
}

export function useForgotPasswordForm(): ForgotPasswordForm {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)
  const [formError, setFormError] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setEmail(event.target.value)
    setError(undefined)
  }

  const submit = async (): Promise<void> => {
    const validationError = validateForgotPasswordEmail(email)
    setFormError(null)
    if (validationError !== null) {
      setError(validationError)
      return
    }
    setSubmitting(true)
    const result = await requestPasswordReset(email.trim())
    setSubmitting(false)
    if (result.error) {
      const fieldError = result.details.find((detail) => detail.field === 'email')
      if (fieldError === undefined) {
        setFormError(result.message)
      } else {
        setError(fieldError.message)
      }
      return
    }
    setConfirmation(result.data.message)
  }

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>): void => {
    event.preventDefault()
    if (!submitting) {
      void submit()
    }
  }

  return { email, error, formError, confirmation, submitting, handleChange, handleSubmit }
}
