"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { adminApi, AdminUser } from "@/lib/api/admin-client";

interface UseAdminAuthReturn {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

/**
 * Hook for admin authentication
 * Manages admin session state and provides login/logout functionality
 */
export function useAdminAuth(): UseAdminAuthReturn {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = () => {
      const storedAdmin = adminApi.getStoredAdmin();
      const isAuth = adminApi.isAuthenticated();

      if (isAuth && storedAdmin) {
        setAdmin(storedAdmin);
      } else {
        setAdmin(null);
      }
      setIsLoading(false);
    };

    checkAuth();

    // Listen for storage events to sync across tabs
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "admin_token" || event.key === "admin_user") {
        checkAuth();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<{ error?: string }> => {
      try {
        const response = await adminApi.login(email, password);
        setAdmin(response.admin);
        router.push("/admin/dashboard");
        return {};
      } catch (error) {
        const apiError = error as { detail?: string; status?: number };
        return {
          error: apiError.detail || "Login failed. Please try again.",
        };
      }
    },
    [router]
  );

  const logout = useCallback(async () => {
    try {
      await adminApi.logout();
    } finally {
      setAdmin(null);
      router.push("/admin/login");
    }
  }, [router]);

  return {
    admin,
    isAuthenticated: !!admin,
    isLoading,
    login,
    logout,
  };
}

/**
 * Hook to require admin authentication
 * Redirects to login page if not authenticated
 */
export function useRequireAdminAuth(): UseAdminAuthReturn {
  const auth = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      router.push("/admin/login");
    }
  }, [auth.isLoading, auth.isAuthenticated, router]);

  return auth;
}
