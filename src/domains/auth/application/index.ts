export {
  canManageProducts,
  fetchCurrentSession,
  getPostLoginPath,
  getRoleLabel,
  hasStoredSession,
  requestPasswordReset,
  SESSION_EXPIRED_NOTICE,
  signInRequest,
  signOutRequest,
  subscribeToSessionEnd,
  validateForgotPasswordEmail,
  validateLoginInput,
} from './auth.service.ts'
export type {
  AuthSession,
  AuthUser,
  LoginFieldErrors,
  LoginInput,
  UserRole,
} from '../domain/index.ts'
