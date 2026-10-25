// Public entry point of the auth domain.
export { canManageProducts, getRoleLabel } from './application/index.ts'
export type { AuthUser, UserRole } from './application/index.ts'
export {
  AuthProvider,
  ForgotPasswordPage,
  LoginPage,
  RedirectIfAuthenticated,
  RequireAuth,
  RequireRole,
  useAuth,
} from './presentation/index.ts'
