"use client";

import { useAuth, type AuthUser } from "@/lib/auth";

/**
 * Hook to get current user. Uses the AuthProvider context.
 * This is a compatibility wrapper around useAuth.
 */
export function useUser(): { user: AuthUser | null; loading: boolean } {
  const { user, isLoading } = useAuth();
  return { user, loading: isLoading };
}
