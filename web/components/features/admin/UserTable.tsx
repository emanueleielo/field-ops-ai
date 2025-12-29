"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  FileText,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserListItem, TierType } from "@/lib/api/admin-client";

interface UserTableProps {
  users: UserListItem[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  total: number;
  search: string;
  tierFilter: TierType | null;
  onSearchChange: (search: string) => void;
  onTierFilterChange: (tier: TierType | null) => void;
  onPageChange: (page: number) => void;
  onEditUser: (user: UserListItem) => void;
  onDeleteUser: (user: UserListItem) => void;
  onImpersonateUser: (user: UserListItem) => void;
}

const tierConfig: Record<TierType, { label: string; color: string }> = {
  basic: { label: "Basic", color: "bg-industrial-100 text-industrial-700" },
  professional: {
    label: "Professional",
    color: "bg-primary-100 text-primary-700",
  },
  enterprise: { label: "Enterprise", color: "bg-warning-100 text-warning-700" },
};

/**
 * User table component with search, filter, and pagination
 * Displays user list with quick actions
 */
export function UserTable({
  users,
  isLoading,
  page,
  totalPages,
  total,
  search,
  tierFilter,
  onSearchChange,
  onTierFilterChange,
  onPageChange,
  onEditUser,
  onDeleteUser,
  onImpersonateUser,
}: UserTableProps) {
  const [searchInput, setSearchInput] = useState(search);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(searchInput);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  const getQuotaColor = (percentage: number) => {
    if (percentage >= 100) return "bg-danger-500";
    if (percentage >= 80) return "bg-warning-500";
    return "bg-success-500";
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-industrial-400" />
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" variant="outline" size="default">
            Search
          </Button>
        </form>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "min-w-[140px] justify-between",
                tierFilter && "border-warning-400 bg-warning-50"
              )}
            >
              <span className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                {tierFilter ? tierConfig[tierFilter].label : "All Tiers"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onTierFilterChange(null)}>
              All Tiers
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onTierFilterChange("basic")}>
              Basic
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onTierFilterChange("professional")}>
              Professional
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onTierFilterChange("enterprise")}>
              Enterprise
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="rounded-industrial border border-industrial-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-industrial-200 bg-industrial-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-industrial-600 uppercase tracking-wider">
                  User
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-industrial-600 uppercase tracking-wider">
                  Tier
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-industrial-600 uppercase tracking-wider">
                  Quota
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-industrial-600 uppercase tracking-wider">
                  Documents
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-industrial-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-industrial-600 uppercase tracking-wider">
                  Last Active
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-industrial-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-industrial-100">
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-4">
                      <div className="h-4 bg-industrial-200 rounded w-40" />
                      <div className="h-3 bg-industrial-100 rounded w-32 mt-1" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-6 bg-industrial-200 rounded w-20" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-2 bg-industrial-200 rounded w-24" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 bg-industrial-200 rounded w-8" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-6 bg-industrial-200 rounded w-16" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 bg-industrial-200 rounded w-20" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-8 bg-industrial-200 rounded w-8 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="text-industrial-400">
                      <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm font-medium">No users found</p>
                      <p className="text-xs mt-1">
                        Try adjusting your search or filter criteria
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-industrial-50 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div>
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="font-medium text-industrial-900 hover:text-warning-600 transition-colors"
                        >
                          {user.name}
                        </Link>
                        <div className="text-sm text-industrial-500">
                          {user.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          tierConfig[user.tier].color
                        )}
                      >
                        {tierConfig[user.tier].label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-industrial-200 rounded-full max-w-[100px]">
                          <div
                            className={cn(
                              "h-2 rounded-full transition-all",
                              getQuotaColor(user.quota_percentage)
                            )}
                            style={{
                              width: `${Math.min(user.quota_percentage, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-industrial-600 min-w-[40px]">
                          {user.quota_percentage.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 text-industrial-600">
                        <FileText className="w-4 h-4" />
                        <span className="text-sm">{user.documents_count}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {user.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-700">
                          <div className="w-1.5 h-1.5 rounded-full bg-success-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-industrial-100 text-industrial-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-industrial-400" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-industrial-600">
                      {formatRelativeTime(user.last_activity)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/users/${user.id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEditUser(user)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onImpersonateUser(user)}
                            >
                              <UserCheck className="w-4 h-4 mr-2" />
                              Login as User
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDeleteUser(user)}
                              className="text-danger-600 focus:text-danger-600 focus:bg-danger-50"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-industrial-200 bg-industrial-50">
            <div className="text-sm text-industrial-600">
              Showing {users.length} of {total} users
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-industrial-600 min-w-[100px] text-center">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
