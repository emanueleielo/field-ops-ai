/**
 * Auth API client for communicating with backend auth endpoints.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
}

export interface AuthUser {
  id: string;
  email: string;
  full_name: string | null;
  created_at?: string;
}

export interface AuthUserResponse {
  user: AuthUser;
  session: AuthSession;
}

export interface AuthError {
  detail: string;
  status: number;
}

// Storage keys
const ACCESS_TOKEN_KEY = "fieldops_access_token";
const REFRESH_TOKEN_KEY = "fieldops_refresh_token";
const USER_KEY = "fieldops_user";

/**
 * Get stored access token.
 */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Get stored refresh token.
 */
export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Get stored user data.
 */
export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
}

/**
 * Store auth session and user data.
 */
function storeAuthData(response: AuthUserResponse): void {
  if (typeof window === "undefined") return;

  if (response.session.access_token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, response.session.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, response.session.refresh_token);
  }
  localStorage.setItem(USER_KEY, JSON.stringify(response.user));
}

/**
 * Clear stored auth data.
 */
export function clearAuthData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Register a new user.
 */
export async function register(
  email: string,
  password: string,
  fullName?: string
): Promise<AuthUserResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, full_name: fullName }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw { detail: error.detail || "Registration failed", status: response.status };
  }

  const data: AuthUserResponse = await response.json();
  storeAuthData(data);
  return data;
}

/**
 * Login with email and password.
 */
export async function login(
  email: string,
  password: string
): Promise<AuthUserResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw { detail: error.detail || "Login failed", status: response.status };
  }

  const data: AuthUserResponse = await response.json();
  storeAuthData(data);
  return data;
}

/**
 * Refresh the access token using the refresh token.
 */
export async function refreshToken(): Promise<AuthSession> {
  const refresh = getRefreshToken();
  if (!refresh) {
    throw { detail: "No refresh token", status: 401 };
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refresh }),
  });

  if (!response.ok) {
    clearAuthData();
    const error = await response.json();
    throw { detail: error.detail || "Token refresh failed", status: response.status };
  }

  const data: AuthSession = await response.json();
  localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
  return data;
}

/**
 * Get current user from backend.
 */
export async function getMe(): Promise<AuthUser> {
  const token = getAccessToken();
  if (!token) {
    throw { detail: "Not authenticated", status: 401 };
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Try to refresh token
      try {
        await refreshToken();
        return getMe(); // Retry with new token
      } catch {
        clearAuthData();
        throw { detail: "Session expired", status: 401 };
      }
    }
    const error = await response.json();
    throw { detail: error.detail || "Failed to get user", status: response.status };
  }

  return response.json();
}

/**
 * Logout the current user.
 */
export async function logout(): Promise<void> {
  const token = getAccessToken();

  if (token) {
    try {
      await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // Ignore errors on logout
    }
  }

  clearAuthData();
}

/**
 * Request password reset email.
 */
export async function resetPassword(email: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/password/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw { detail: error.detail || "Password reset failed", status: response.status };
  }
}

/**
 * Check if user is authenticated (has valid token).
 */
export function isAuthenticated(): boolean {
  return !!getAccessToken();
}
