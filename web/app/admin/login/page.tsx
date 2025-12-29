"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminAuth } from "@/hooks/useAdminAuth";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className="w-full bg-warning-600 hover:bg-warning-700 text-white"
      disabled={pending}
    >
      {pending ? "Signing in..." : "Sign In to Admin Panel"}
    </Button>
  );
}

/**
 * Admin login page
 * Simple email + password form, no SSO
 */
export default function AdminLoginPage() {
  const [error, setError] = useState<string | null>(null);
  const { login } = useAdminAuth();

  async function handleSubmit(formData: FormData) {
    setError(null);

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    const result = await login(email, password);
    if (result.error) {
      setError(result.error);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-industrial-900 p-6">
      {/* Warning stripe decoration */}
      <div className="fixed top-0 left-0 right-0 h-2 bg-gradient-to-r from-warning-500 via-warning-400 to-warning-500" />

      <div className="w-full max-w-md">
        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-warning-500 rounded-lg shadow-lg mb-4">
            <Shield className="w-8 h-8 text-industrial-900" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="mt-2 text-industrial-400">FieldOps AI Administration</p>
        </div>

        {/* Login form */}
        <div className="bg-white rounded-industrial p-8 shadow-industrial-lg">
          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-industrial bg-danger-50 border border-danger-200 p-4 text-sm text-danger-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form action={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-industrial-700">
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="admin@fieldops.ai"
                autoComplete="email"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-industrial-700">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Enter your password"
                autoComplete="current-password"
                className="h-11"
              />
            </div>

            <SubmitButton />
          </form>

          {/* Security notice */}
          <div className="mt-6 pt-6 border-t border-industrial-200">
            <div className="flex items-start gap-2 text-xs text-industrial-500">
              <Shield className="w-4 h-4 flex-shrink-0 text-warning-500" />
              <p>
                This is a restricted area. Unauthorized access attempts are
                logged and may be reported.
              </p>
            </div>
          </div>
        </div>

        {/* Back to main site */}
        <p className="mt-6 text-center text-sm text-industrial-400">
          <a
            href="/"
            className="hover:text-industrial-300 hover:underline transition-colors"
          >
            Back to main site
          </a>
        </p>
      </div>

      {/* Bottom warning stripe */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-warning-500" />
    </main>
  );
}
