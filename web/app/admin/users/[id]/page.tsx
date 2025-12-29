"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Edit,
  Trash2,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  UserDetails,
  EditUserDialog,
  DeleteUserDialog,
} from "@/components/features/admin";
import {
  adminApi,
  UserDetailResponse,
  UserListItem,
  UserUpdateRequest,
  storeImpersonationSession,
} from "@/lib/api/admin-client";

/**
 * Admin user detail page
 * Displays detailed user information with actions
 */
export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<UserDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialogs
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const fetchUser = useCallback(
    async (showRefreshing = false) => {
      if (showRefreshing) {
        setIsRefreshing(true);
      }
      setError(null);

      try {
        const response = await adminApi.getUser(userId);
        setUser(response);
      } catch (err) {
        const apiError = err as { detail?: string };
        setError(apiError.detail || "Failed to load user details");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Convert UserDetailResponse to UserListItem for dialogs
  const userAsListItem: UserListItem | null = user
    ? {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier,
        is_active: user.is_active,
        quota_percentage: user.quota.percentage,
        documents_count: user.documents_count,
        created_at: user.created_at,
        last_activity: null,
      }
    : null;

  const handleSaveUser = async (userId: string, data: UserUpdateRequest) => {
    setIsEditLoading(true);
    try {
      await adminApi.updateUser(userId, data);
      setShowEditDialog(false);
      fetchUser(true);
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleConfirmDelete = async (userId: string) => {
    setIsDeleteLoading(true);
    try {
      await adminApi.deleteUser(userId);
      setShowDeleteDialog(false);
      router.push("/admin/users");
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleImpersonate = async () => {
    if (!user) return;

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

      // Redirect to user dashboard
      router.push("/dashboard");
    } catch (err) {
      const apiError = err as { detail?: string };
      setError(apiError.detail || "Failed to start impersonation session");
    }
  };

  if (error && isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-danger-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-industrial-900 mb-2">
            Failed to Load User
          </h2>
          <p className="text-industrial-600 mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button asChild variant="outline">
              <Link href="/admin/users">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Users
              </Link>
            </Button>
            <Button onClick={() => fetchUser()} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/users">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-industrial-900">
              User Details
            </h1>
            <p className="text-industrial-600 text-sm">
              {user?.email || "Loading..."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => fetchUser(true)}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`w-4 h-4 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            onClick={() => setShowEditDialog(true)}
            variant="outline"
            size="sm"
            disabled={!user}
          >
            <Edit className="w-4 h-4 mr-1.5" />
            Edit
          </Button>
          <Button
            onClick={handleImpersonate}
            variant="outline"
            size="sm"
            disabled={!user}
            className="border-warning-300 text-warning-700 hover:bg-warning-50"
          >
            <UserCheck className="w-4 h-4 mr-1.5" />
            Login as User
          </Button>
          <Button
            onClick={() => setShowDeleteDialog(true)}
            variant="outline"
            size="sm"
            disabled={!user}
            className="border-danger-300 text-danger-700 hover:bg-danger-50"
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Error banner (non-blocking) */}
      {error && !isLoading && (
        <div className="flex items-center gap-2 p-4 bg-danger-50 border border-danger-200 rounded-industrial text-danger-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
          <Button
            onClick={() => fetchUser(true)}
            variant="ghost"
            size="sm"
            className="ml-auto text-danger-700 hover:text-danger-800 hover:bg-danger-100"
          >
            Retry
          </Button>
        </div>
      )}

      {/* User Details */}
      <UserDetails user={user} isLoading={isLoading} />

      {/* Edit User Dialog */}
      <EditUserDialog
        user={userAsListItem}
        isOpen={showEditDialog}
        isLoading={isEditLoading}
        onClose={() => setShowEditDialog(false)}
        onSave={handleSaveUser}
      />

      {/* Delete User Dialog */}
      <DeleteUserDialog
        user={userAsListItem}
        isOpen={showDeleteDialog}
        isLoading={isDeleteLoading}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
