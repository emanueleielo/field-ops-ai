"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserCheck, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  adminApi,
  storeImpersonationSession,
  UserListItem,
} from "@/lib/api/admin-client";

interface ImpersonateButtonProps {
  user: UserListItem;
  variant?: "button" | "icon";
  className?: string;
}

/**
 * Button to initiate user impersonation
 * Shows confirmation dialog before starting session
 */
export function ImpersonateButton({
  user,
  variant = "button",
  className,
}: ImpersonateButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImpersonate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await adminApi.impersonateUser(user.id);

      // Store the impersonation session data
      storeImpersonationSession(
        {
          userId: response.user_id,
          userEmail: response.user_email,
          sessionId: response.session_id,
          expiresAt: response.expires_at,
        },
        response.admin_token
      );

      // Store the user token for the dashboard to use
      localStorage.setItem("impersonation_token", response.access_token);

      setIsOpen(false);

      // Redirect to user dashboard
      router.push("/dashboard");
    } catch (err) {
      const apiError = err as { detail?: string };
      setError(apiError.detail || "Failed to start impersonation session");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {variant === "button" ? (
        <Button
          onClick={() => setIsOpen(true)}
          className={className}
          variant="outline"
        >
          <UserCheck className="w-4 h-4 mr-2" />
          Login as User
        </Button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className={className}
          title="Login as this user"
        >
          <UserCheck className="w-4 h-4" />
        </button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-warning-100 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-warning-600" />
              </div>
              <div>
                <DialogTitle>Login as User</DialogTitle>
                <DialogDescription>Start impersonation session</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <p className="text-sm text-industrial-600">
              You are about to view the dashboard as:
            </p>

            <div className="p-4 bg-industrial-50 border border-industrial-200 rounded-lg">
              <p className="font-medium text-industrial-900">{user.name}</p>
              <p className="text-sm text-industrial-600">{user.email}</p>
            </div>

            <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg">
              <p className="text-sm text-warning-800">
                <strong>Note:</strong> You will be redirected to the user&apos;s
                dashboard. A banner will be shown indicating you are in
                impersonation mode. Click &quot;Exit Impersonation&quot; to return to the
                admin panel.
              </p>
            </div>

            <p className="text-xs text-industrial-500">
              This session will expire in 2 hours. All actions taken during
              impersonation are logged for audit purposes.
            </p>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-danger-50 border border-danger-200 rounded text-sm text-danger-700">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImpersonate}
              disabled={isLoading}
              className="bg-warning-500 hover:bg-warning-600 text-white"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <UserCheck className="w-4 h-4 mr-2" />
              )}
              Start Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
