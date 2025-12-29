"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Cookie name for server-side auth check
const ACCESS_TOKEN_COOKIE = "fieldops_access_token";

interface ActionResult {
  error?: string;
}

/**
 * Server action for login.
 * Stores token in cookie for middleware access and redirects to dashboard.
 */
export async function login(formData: FormData): Promise<ActionResult | void> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || "Invalid credentials" };
    }

    const data = await response.json();

    // Store access token in httpOnly cookie for middleware
    const cookieStore = await cookies();
    cookieStore.set(ACCESS_TOKEN_COOKIE, data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: data.session.expires_in,
      path: "/",
    });
  } catch {
    return { error: "An error occurred during login" };
  }

  // Redirect on success (outside try-catch because redirect throws)
  revalidatePath("/", "layout");
  redirect("/documents");
}

/**
 * Server action for signup.
 * Creates account and redirects appropriately.
 */
export async function signup(formData: FormData): Promise<ActionResult | void> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || "Registration failed" };
    }

    const data = await response.json();

    // If session returned (no email confirmation needed), store token
    if (data.session?.access_token) {
      const cookieStore = await cookies();
      cookieStore.set(ACCESS_TOKEN_COOKIE, data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: data.session.expires_in || 3600,
        path: "/",
      });
    }
  } catch {
    return { error: "An error occurred during registration" };
  }

  // Redirect to login with success message
  revalidatePath("/", "layout");
  redirect("/login?message=Account created successfully. Please sign in.");
}

/**
 * Server action for Google OAuth.
 * Note: OAuth flow requires direct Supabase integration which is not
 * available in the backend-proxy architecture.
 */
export async function signInWithGoogle(): Promise<ActionResult> {
  return {
    error: "Google sign-in is not available. Please use email and password.",
  };
}

/**
 * Server action for logout.
 * Clears cookie and redirects to login.
 */
export async function signOut(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

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
      // Ignore logout errors
    }
  }

  // Clear the cookie
  cookieStore.delete(ACCESS_TOKEN_COOKIE);

  revalidatePath("/", "layout");
  redirect("/login");
}

/**
 * Server action for password reset.
 */
export async function resetPassword(
  formData: FormData
): Promise<ActionResult | void> {
  const email = formData.get("email") as string;

  try {
    await fetch(`${API_BASE_URL}/api/v1/auth/password/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
  } catch {
    // Ignore errors - always show success to prevent email enumeration
  }

  redirect("/login?message=If an account exists, a reset link has been sent.");
}
