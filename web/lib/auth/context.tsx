"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  type AuthUser,
  getStoredUser,
  getAccessToken,
  logout as logoutApi,
  getMe,
  clearAuthData,
} from "./client";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        setUser(null);
        return;
      }

      // First try stored user for faster initial load
      const storedUser = getStoredUser();
      if (storedUser) {
        setUser(storedUser);
      }

      // Then verify with backend
      const freshUser = await getMe();
      setUser(freshUser);
    } catch {
      setUser(null);
      clearAuthData();
    }
  }, []);

  useEffect(() => {
    async function initAuth() {
      setIsLoading(true);
      await refreshUser();
      setIsLoading(false);
    }

    initAuth();
  }, [refreshUser]);

  const logout = useCallback(async () => {
    await logoutApi();
    setUser(null);
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
