// One-shot messages carried in router location state across a navigation.

import type { ToastTone } from './ToastContext.ts'

export interface FlashMessage {
  message: string
  tone: ToastTone
}

/** Location state for `navigate(to, { state: flashState('Saved') })`. */
export function flashState(message: string, tone: ToastTone = 'success'): { flash: FlashMessage } {
  return { flash: { message, tone } }
}

export function readFlash(state: unknown): FlashMessage | null {
  if (typeof state !== 'object' || state === null || !('flash' in state)) {
    return null
  }
  const flash = state.flash
  if (typeof flash !== 'object' || flash === null || !('message' in flash) || !('tone' in flash)) {
    return null
  }
  const { message, tone } = flash
  if (typeof message !== 'string' || (tone !== 'success' && tone !== 'error' && tone !== 'info')) {
    return null
  }
  return { message, tone }
}
