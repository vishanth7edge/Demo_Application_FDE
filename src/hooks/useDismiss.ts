import { useEffect, useRef } from 'react'

// Closes a popup (menu, filter panel) on Escape or a pointer press outside `ref`.
export function useDismiss(
  ref: React.RefObject<HTMLElement | null>,
  open: boolean,
  onDismiss: () => void,
): void {
  const onDismissRef = useRef(onDismiss)
  useEffect(() => {
    onDismissRef.current = onDismiss
  })

  useEffect(() => {
    if (!open) {
      return
    }
    const onPointerDown = (event: PointerEvent): void => {
      if (!(event.target instanceof Node) || !ref.current?.contains(event.target)) {
        onDismissRef.current()
      }
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onDismissRef.current()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [ref, open])
}
