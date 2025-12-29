"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { login, signInWithGoogle } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Signing in..." : "Sign In"}
    </Button>
  );
}

function GoogleButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="outline"
      className="w-full"
      disabled={pending}
    >
      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="currentColor"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="currentColor"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="currentColor"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      {pending ? "Redirecting..." : "Continue with Google"}
    </Button>
  );
}

interface LoginFormProps {
  message?: string;
  errorMessage?: string;
}

export function LoginForm({ message, errorMessage }: LoginFormProps) {
  const [error, setError] = useState<string | null>(errorMessage || null);

  async function handleLogin(formData: FormData) {
    setError(null);
    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    const result = await signInWithGoogle();
    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <div className="w-full space-y-6">
      {message && (
        <div className="rounded-industrial bg-success-50 p-4 text-center text-sm text-success-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-industrial bg-danger-50 p-4 text-center text-sm text-danger-700">
          {error}
        </div>
      )}

      <form action={handleLogin} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-industrial-700"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-industrial border border-industrial-300 px-4 py-2 text-industrial-900 placeholder-industrial-400 focus:border-industrial-500 focus:outline-none focus:ring-2 focus:ring-industrial-500"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-industrial-700"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full rounded-industrial border border-industrial-300 px-4 py-2 text-industrial-900 placeholder-industrial-400 focus:border-industrial-500 focus:outline-none focus:ring-2 focus:ring-industrial-500"
            placeholder="Your password"
          />
        </div>

        <SubmitButton />
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-industrial-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-industrial-500">
            Or continue with
          </span>
        </div>
      </div>

      <form action={handleGoogleSignIn}>
        <GoogleButton />
      </form>

      <p className="text-center text-sm text-industrial-600">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-industrial-900 hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
