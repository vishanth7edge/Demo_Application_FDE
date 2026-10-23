import { useSelector } from 'react-redux'

import type { RootState } from '../store/store.ts'

// Use instead of plain useSelector so `state` is typed as RootState.
export const useAppSelector = useSelector.withTypes<RootState>()
