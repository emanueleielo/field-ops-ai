"use client";

import { useAuth, type AuthSession } from "@/lib/auth";

/**
 * Hook to get current session. Uses the AuthProvider context.
 * This is a compatibility wrapper around useAuth.
 *
 * Note: In the new auth architecture, session data is stored in localStorage
 * and managed by the AuthProvider. This hook provides compatibility with
 * components that expected the old Supabase session format.
 */
export function useSession(): { session: AuthSession | null; loading: boolean } {
  const { isLoading, isAuthenticated } = useAuth();

  // In the new architecture, we don't have a full session object like Supabase
  // We return a minimal session-like object for compatibility
  const session: AuthSession | null = isAuthenticated
    ? {
        access_token: "", // Token is managed internally by auth client
        refresh_token: "",
        token_type: "bearer",
        expires_in: 0,
        expires_at: 0,
      }
    : null;

  return { session, loading: isLoading };
}
