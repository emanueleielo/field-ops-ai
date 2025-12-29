"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, X, AlertTriangle, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminApi, AdminNotification } from "@/lib/api/admin-client";

interface NotificationBellProps {
  initialCount?: number;
  className?: string;
}

/**
 * Notification bell component with badge and dropdown
 * Shows unread admin notifications
 */
export function NotificationBell({
  initialCount = 0,
  className,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update unread count when initialCount changes
  useEffect(() => {
    setUnreadCount(initialCount);
  }, [initialCount]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notifications when dropdown opens
  const handleToggle = async () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);

    if (newIsOpen && notifications.length === 0) {
      setIsLoading(true);
      try {
        const data = await adminApi.getNotifications();
        setNotifications(data.notifications);
        setUnreadCount(data.unread_count);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Mark notification as read
  const handleMarkRead = async (notificationId: string) => {
    try {
      await adminApi.markNotificationRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const getNotificationIcon = (type: AdminNotification["type"]) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-warning-500" />;
      case "critical":
        return <XCircle className="w-4 h-4 text-danger-500" />;
      case "info":
      default:
        return <Info className="w-4 h-4 text-industrial-500" />;
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className={cn(
          "relative p-2 rounded-lg transition-colors",
          isOpen
            ? "bg-warning-100 text-warning-700"
            : "text-industrial-600 hover:bg-industrial-100 hover:text-industrial-900"
        )}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-danger-500 rounded-full">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-industrial border border-industrial-200 shadow-industrial-lg z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-industrial-200">
            <h3 className="text-sm font-semibold text-industrial-900">
              Notifications
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-industrial-400 hover:text-industrial-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-industrial-500">
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-industrial-500">
                No notifications
              </div>
            ) : (
              <div className="divide-y divide-industrial-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "px-4 py-3 hover:bg-industrial-50 transition-colors cursor-pointer",
                      !notification.is_read && "bg-warning-50/50"
                    )}
                    onClick={() =>
                      !notification.is_read && handleMarkRead(notification.id)
                    }
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-sm",
                            !notification.is_read
                              ? "font-medium text-industrial-900"
                              : "text-industrial-700"
                          )}
                        >
                          {notification.title}
                        </p>
                        <p className="text-xs text-industrial-500 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-industrial-400 mt-1">
                          {formatTimeAgo(notification.created_at)}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-warning-500 rounded-full mt-1.5" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-industrial-200">
              <a
                href="/admin/notifications"
                className="text-sm font-medium text-warning-600 hover:text-warning-700 hover:underline"
              >
                View all notifications
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
