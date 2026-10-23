// One-off messages passed between pages in router location state (see .claude/rules).
// The products page shows them in the design's "Success Modal".

export interface FlashState {
  title: string
  message: string
}

export function flashState(title: string, message: string): FlashState {
  return { title, message }
}

export function readFlashMessage(state: unknown): FlashState | null {
  if (
    typeof state === 'object' &&
    state !== null &&
    'title' in state &&
    'message' in state &&
    typeof state.title === 'string' &&
    typeof state.message === 'string'
  ) {
    return { title: state.title, message: state.message }
  }
  return null
}

// "12", but not "0", "-1", "1.5" or "abc".
export function parseProductId(value: string | undefined): number | null {
  return value !== undefined && /^[1-9]\d*$/.test(value) ? Number(value) : null
}
