import { useDispatch } from 'react-redux'

import type { AppDispatch } from '../store/store.ts'

// Use instead of plain useDispatch so dispatch knows the app's action types.
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
