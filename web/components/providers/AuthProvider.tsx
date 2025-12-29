"use client";

import { AuthProvider as AuthProviderBase } from "@/lib/auth/context";
import type { ReactNode } from "react";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return <AuthProviderBase>{children}</AuthProviderBase>;
}
