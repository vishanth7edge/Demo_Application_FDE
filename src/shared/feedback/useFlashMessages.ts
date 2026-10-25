import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router'

import { readFlash } from './flash.ts'
import { useToast } from './useToast.ts'

/**
 * Shows a flash message passed in location state once, then clears it from history so it
 * does not reappear on refresh or Back. Mount once, inside the router.
 */
export function useFlashMessages(): void {
  const location = useLocation()
  const navigate = useNavigate()
  const { notify } = useToast()
  const handledKey = useRef<string | null>(null)

  useEffect(() => {
    const flash = readFlash(location.state)
    if (flash === null || handledKey.current === location.key) {
      return
    }
    handledKey.current = location.key
    notify(flash.message, flash.tone)
    void navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
  }, [location, navigate, notify])
}
