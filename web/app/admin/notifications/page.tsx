"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, AlertCircle, Check, Filter } from "lucide-react";
import { NotificationList } from "@/components/features/admin";
import { Button } from "@/components/ui/button";
import { adminApi, NotificationsList } from "@/lib/api/admin-client";

/**
 * Admin notifications page
 * Displays and manages admin notifications
 */
export default function AdminNotificationsPage() {
  const [data, setData] = useState<NotificationsList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const limit = 20;

  const fetchNotifications = useCallback(
    async (showRefreshing = false) => {
      if (showRefreshing) setIsRefreshing(true);
      setError(null);

      try {
        const result = await adminApi.getNotifications(page, limit, showUnreadOnly);
        setData(result);
      } catch (err) {
        const apiError = err as { detail?: string };
        setError(apiError.detail || "Failed to load notifications");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [page, showUnreadOnly]
  );

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await adminApi.markNotificationRead(id);
      // Update local state
      if (data) {
        const updated = data.notifications.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        );
        setData({
          ...data,
          notifications: updated,
          unread_count: data.unread_count - 1,
        });
      }
    } catch (err) {
      const apiError = err as { detail?: string };
      setError(apiError.detail || "Failed to mark as read");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteNotification(id);
      // Update local state
      if (data) {
        const notification = data.notifications.find((n) => n.id === id);
        const updated = data.notifications.filter((n) => n.id !== id);
        setData({
          ...data,
          notifications: updated,
          total: data.total - 1,
          unread_count: notification?.is_read
            ? data.unread_count
            : data.unread_count - 1,
        });
      }
    } catch (err) {
      const apiError = err as { detail?: string };
      setError(apiError.detail || "Failed to delete notification");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await adminApi.markAllNotificationsRead();
      // Update local state
      if (data) {
        const updated = data.notifications.map((n) => ({ ...n, is_read: true }));
        setData({
          ...data,
          notifications: updated,
          unread_count: 0,
        });
      }
    } catch (err) {
      const apiError = err as { detail?: string };
      setError(apiError.detail || "Failed to mark all as read");
    }
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  if (error && isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-danger-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-industrial-900 mb-2">
            Failed to Load Notifications
          </h2>
          <p className="text-industrial-600 mb-4">{error}</p>
          <Button onClick={() => fetchNotifications()} variant="outline">
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
        <div>
          <h1 className="text-2xl font-bold text-industrial-900">
            Notifications
          </h1>
          <p className="text-industrial-600 mt-1">
            System alerts and important updates
            {data && data.unread_count > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-700">
                {data.unread_count} unread
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => fetchNotifications(true)}
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
      </div>

      {/* Error banner */}
      {error && !isLoading && (
        <div className="flex items-center gap-2 p-4 bg-danger-50 border border-danger-200 rounded-industrial text-danger-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
          <Button
            onClick={() => fetchNotifications(true)}
            variant="ghost"
            size="sm"
            className="ml-auto text-danger-700 hover:text-danger-800 hover:bg-danger-100"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Filters and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-industrial border border-industrial-200 p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-industrial-500" />
            <span className="text-sm text-industrial-600">Filter:</span>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showUnreadOnly}
              onChange={(e) => {
                setShowUnreadOnly(e.target.checked);
                setPage(1);
              }}
              className="w-4 h-4 rounded border-industrial-300 text-warning-600 focus:ring-warning-500"
            />
            <span className="text-sm text-industrial-700">
              Show unread only
            </span>
          </label>
        </div>

        {data && data.unread_count > 0 && (
          <Button
            onClick={handleMarkAllAsRead}
            variant="outline"
            size="sm"
            className="border-success-300 text-success-700 hover:bg-success-50"
          >
            <Check className="w-4 h-4 mr-1.5" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Notification list */}
      <NotificationList
        notifications={data?.notifications || []}
        onMarkAsRead={handleMarkAsRead}
        onDelete={handleDelete}
        isLoading={isLoading}
      />

      {/* Pagination */}
      {data && totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-industrial border border-industrial-200 p-4">
          <div className="text-sm text-industrial-600">
            Showing {(page - 1) * limit + 1}-
            {Math.min(page * limit, data.total)} of {data.total} notifications
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-industrial-600 px-2">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
