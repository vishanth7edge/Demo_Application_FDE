import { use } from 'react'

import { ToastContext } from './ToastContext.ts'
import type { ToastApi } from './ToastContext.ts'

export function useToast(): ToastApi {
  const api = use(ToastContext)
  if (api === null) {
    throw new Error('useToast() must be used inside <ToastProvider>')
  }
  return api
}
