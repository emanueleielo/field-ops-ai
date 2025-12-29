"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Users, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  UserTable,
  EditUserDialog,
  DeleteUserDialog,
} from "@/components/features/admin";
import {
  adminApi,
  UserListItem,
  UserListResponse,
  UserUpdateRequest,
  TierType,
  storeImpersonationSession,
} from "@/lib/api/admin-client";

/**
 * Admin users list page
 * Displays paginated user list with search, filter, and actions
 */
export default function AdminUsersPage() {
  const router = useRouter();
  const [data, setData] = useState<UserListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination and filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<TierType | null>(null);

  // Dialogs
  const [editUser, setEditUser] = useState<UserListItem | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserListItem | null>(null);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const fetchUsers = useCallback(
    async (showRefreshing = false) => {
      if (showRefreshing) {
        setIsRefreshing(true);
      }
      setError(null);

      try {
        const response = await adminApi.getUsers({
          page,
          limit: 20,
          search: search || undefined,
          tier: tierFilter || undefined,
        });
        setData(response);
      } catch (err) {
        const apiError = err as { detail?: string };
        setError(apiError.detail || "Failed to load users");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [page, search, tierFilter]
  );

  // Initial fetch and refetch on filter changes
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    setPage(1); // Reset to first page
  };

  const handleTierFilterChange = (tier: TierType | null) => {
    setTierFilter(tier);
    setPage(1); // Reset to first page
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleEditUser = (user: UserListItem) => {
    setEditUser(user);
  };

  const handleSaveUser = async (userId: string, data: UserUpdateRequest) => {
    setIsEditLoading(true);
    try {
      await adminApi.updateUser(userId, data);
      setEditUser(null);
      fetchUsers(true);
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleDeleteUser = (user: UserListItem) => {
    setDeleteUser(user);
  };

  const handleConfirmDelete = async (userId: string) => {
    setIsDeleteLoading(true);
    try {
      await adminApi.deleteUser(userId);
      setDeleteUser(null);
      fetchUsers(true);
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleImpersonateUser = async (user: UserListItem) => {
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
            Failed to Load Users
          </h2>
          <p className="text-industrial-600 mb-4">{error}</p>
          <Button onClick={() => fetchUsers()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-warning-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-warning-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-industrial-900">
              User Management
            </h1>
            <p className="text-industrial-600 text-sm">
              {data?.meta.total ?? 0} total users
            </p>
          </div>
        </div>

        <Button
          onClick={() => fetchUsers(true)}
          variant="outline"
          size="sm"
          disabled={isRefreshing}
          className="border-warning-300 text-warning-700 hover:bg-warning-50"
        >
          <RefreshCw
            className={`w-4 h-4 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Error banner (non-blocking) */}
      {error && !isLoading && (
        <div className="flex items-center gap-2 p-4 bg-danger-50 border border-danger-200 rounded-industrial text-danger-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
          <Button
            onClick={() => fetchUsers(true)}
            variant="ghost"
            size="sm"
            className="ml-auto text-danger-700 hover:text-danger-800 hover:bg-danger-100"
          >
            Retry
          </Button>
        </div>
      )}

      {/* User Table */}
      <UserTable
        users={data?.users ?? []}
        isLoading={isLoading}
        page={page}
        totalPages={data?.meta.total_pages ?? 0}
        total={data?.meta.total ?? 0}
        search={search}
        tierFilter={tierFilter}
        onSearchChange={handleSearchChange}
        onTierFilterChange={handleTierFilterChange}
        onPageChange={handlePageChange}
        onEditUser={handleEditUser}
        onDeleteUser={handleDeleteUser}
        onImpersonateUser={handleImpersonateUser}
      />

      {/* Edit User Dialog */}
      <EditUserDialog
        user={editUser}
        isOpen={!!editUser}
        isLoading={isEditLoading}
        onClose={() => setEditUser(null)}
        onSave={handleSaveUser}
      />

      {/* Delete User Dialog */}
      <DeleteUserDialog
        user={deleteUser}
        isOpen={!!deleteUser}
        isLoading={isDeleteLoading}
        onClose={() => setDeleteUser(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
