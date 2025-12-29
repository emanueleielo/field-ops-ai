"use client";

import { AdminNotification } from "@/lib/api/admin-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Check,
  Trash2,
  Clock,
} from "lucide-react";

interface NotificationListProps {
  notifications: AdminNotification[];
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

const typeConfig = {
  critical: {
    icon: AlertCircle,
    bgColor: "bg-danger-50",
    borderColor: "border-danger-200",
    iconColor: "text-danger-600",
    badge: "bg-danger-100 text-danger-700",
  },
  warning: {
    icon: AlertTriangle,
    bgColor: "bg-warning-50",
    borderColor: "border-warning-200",
    iconColor: "text-warning-600",
    badge: "bg-warning-100 text-warning-700",
  },
  info: {
    icon: Info,
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    iconColor: "text-blue-600",
    badge: "bg-blue-100 text-blue-700",
  },
};

/**
 * Notification list component
 * Displays admin notifications with mark as read and delete actions
 */
export function NotificationList({
  notifications,
  onMarkAsRead,
  onDelete,
  isLoading,
}: NotificationListProps) {
  const formatDate = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours} hours ago`;
      if (diffDays < 7) return `${diffDays} days ago`;

      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse bg-white rounded-industrial border border-industrial-200 p-4"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-industrial-100" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-industrial-100 rounded w-1/3" />
                <div className="h-3 bg-industrial-100 rounded w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="bg-white rounded-industrial border border-industrial-200 p-8 text-center">
        <Check className="w-12 h-12 text-success-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-industrial-900 mb-2">
          All caught up!
        </h3>
        <p className="text-industrial-600">You have no notifications.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => {
        const config = typeConfig[notification.type];
        const Icon = config.icon;

        return (
          <div
            key={notification.id}
            className={cn(
              "rounded-industrial border p-4 transition-all hover:shadow-industrial",
              notification.is_read
                ? "bg-white border-industrial-200"
                : config.bgColor + " " + config.borderColor
            )}
          >
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "p-2 rounded-full",
                  notification.is_read
                    ? "bg-industrial-100"
                    : config.badge.split(" ")[0]
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5",
                    notification.is_read ? "text-industrial-500" : config.iconColor
                  )}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4
                        className={cn(
                          "font-semibold",
                          notification.is_read
                            ? "text-industrial-700"
                            : "text-industrial-900"
                        )}
                      >
                        {notification.title}
                      </h4>
                      {!notification.is_read && (
                        <span className="w-2 h-2 bg-warning-500 rounded-full" />
                      )}
                    </div>
                    <p
                      className={cn(
                        "text-sm mt-1",
                        notification.is_read
                          ? "text-industrial-500"
                          : "text-industrial-600"
                      )}
                    >
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-industrial-400">
                      <Clock className="w-3 h-3" />
                      {formatDate(notification.created_at)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onMarkAsRead(notification.id)}
                        className="text-industrial-600 hover:text-industrial-800 hover:bg-industrial-100"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(notification.id)}
                      className="text-industrial-400 hover:text-danger-600 hover:bg-danger-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Additional data if present */}
                {notification.data && Object.keys(notification.data).length > 0 && (
                  <div className="mt-2 p-2 bg-industrial-50 rounded text-xs font-mono text-industrial-600">
                    {Object.entries(notification.data).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-industrial-500">{key}:</span>{" "}
                        {String(value)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
