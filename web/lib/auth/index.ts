/**
 * Auth module exports.
 */

export {
  type AuthUser,
  type AuthSession,
  type AuthUserResponse,
  type AuthError,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  clearAuthData,
  register,
  login,
  refreshToken,
  getMe,
  logout,
  resetPassword,
  isAuthenticated,
} from "./client";

export { AuthProvider, useAuth } from "./context";

export {
  login as loginAction,
  signup as signupAction,
  signOut as logoutAction,
  signInWithGoogle,
  resetPassword as resetPasswordAction,
} from "./actions";
