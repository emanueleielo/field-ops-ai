"use client";

import { useState } from "react";
import {
  FileText,
  Upload,
  Trash2,
  AlertTriangle,
  CreditCard,
  LogIn,
  CheckCircle,
  XCircle,
  Filter,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Activity types and their configs
const activityConfig = {
  doc_uploaded: {
    icon: Upload,
    color: "text-success-600",
    bg: "bg-success-50",
    label: "Document Uploaded",
  },
  doc_deleted: {
    icon: Trash2,
    color: "text-danger-600",
    bg: "bg-danger-50",
    label: "Document Deleted",
  },
  doc_failed: {
    icon: XCircle,
    color: "text-danger-600",
    bg: "bg-danger-50",
    label: "Processing Failed",
  },
  doc_indexed: {
    icon: CheckCircle,
    color: "text-success-600",
    bg: "bg-success-50",
    label: "Document Indexed",
  },
  quota_warning: {
    icon: AlertTriangle,
    color: "text-warning-600",
    bg: "bg-warning-50",
    label: "Quota Warning",
  },
  subscription_change: {
    icon: CreditCard,
    color: "text-blue-600",
    bg: "bg-blue-50",
    label: "Subscription Changed",
  },
  login: {
    icon: LogIn,
    color: "text-industrial-600",
    bg: "bg-industrial-50",
    label: "Login",
  },
};

type ActivityType = keyof typeof activityConfig;

interface ActivityItem {
  id: string;
  type: ActivityType;
  description: string;
  metadata: Record<string, string>;
  createdAt: Date;
}

// Mock data
const mockActivities: ActivityItem[] = [
  {
    id: "1",
    type: "doc_indexed",
    description: "CAT-320-Service-Manual.pdf successfully indexed with 156 chunks",
    metadata: { filename: "CAT-320-Service-Manual.pdf", chunks: "156" },
    createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5 min ago
  },
  {
    id: "2",
    type: "doc_uploaded",
    description: "New document uploaded: Komatsu-PC200-Parts.pdf",
    metadata: { filename: "Komatsu-PC200-Parts.pdf", size: "4.2 MB" },
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
  },
  {
    id: "3",
    type: "quota_warning",
    description: "You've reached 90% of your monthly quota",
    metadata: { percentage: "90%", remaining: "1.5 EUR" },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  },
  {
    id: "4",
    type: "doc_failed",
    description: "Failed to process corrupted-file.pdf: Invalid PDF format",
    metadata: { filename: "corrupted-file.pdf", error: "Invalid PDF format" },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
  },
  {
    id: "5",
    type: "login",
    description: "Logged in from Chrome on macOS",
    metadata: { browser: "Chrome", os: "macOS" },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
  },
  {
    id: "6",
    type: "subscription_change",
    description: "Upgraded to Professional plan",
    metadata: { from: "Basic", to: "Professional" },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
  },
  {
    id: "7",
    type: "doc_deleted",
    description: "Deleted document: old-manual.pdf",
    metadata: { filename: "old-manual.pdf" },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
  },
  {
    id: "8",
    type: "doc_indexed",
    description: "Volvo-EC220E-Maintenance.pdf successfully indexed with 89 chunks",
    metadata: { filename: "Volvo-EC220E-Maintenance.pdf", chunks: "89" },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 7 days ago
  },
];

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function ActivityPage() {
  const [filter, setFilter] = useState<ActivityType | "all">("all");
  const [activities] = useState<ActivityItem[]>(mockActivities);

  const filteredActivities =
    filter === "all"
      ? activities
      : activities.filter((a) => a.type === filter);

  const filterOptions: { value: ActivityType | "all"; label: string }[] = [
    { value: "all", label: "All Activity" },
    { value: "doc_uploaded", label: "Uploads" },
    { value: "doc_indexed", label: "Indexed" },
    { value: "doc_failed", label: "Failures" },
    { value: "doc_deleted", label: "Deletions" },
    { value: "quota_warning", label: "Quota" },
    { value: "login", label: "Logins" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-industrial-900">
            Activity Feed
          </h2>
          <p className="text-sm text-industrial-500">
            Track all events and changes in your account
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 text-industrial-400 shrink-0" />
        {filterOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors",
              filter === option.value
                ? "bg-industrial-900 text-white"
                : "bg-industrial-100 text-industrial-600 hover:bg-industrial-200"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Activity List */}
      <Card className="industrial-panel">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            {filteredActivities.length} events
            {filter !== "all" && " matching filter"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-xl bg-industrial-100 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-industrial-400" />
              </div>
              <p className="text-industrial-500">No activity found</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredActivities.map((activity, index) => {
                const config = activityConfig[activity.type];
                const Icon = config.icon;

                return (
                  <div
                    key={activity.id}
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-lg transition-colors hover:bg-industrial-50",
                      index !== filteredActivities.length - 1 &&
                        "border-b border-industrial-100"
                    )}
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                        config.bg
                      )}
                    >
                      <Icon className={cn("w-5 h-5", config.color)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-industrial-900">
                            {config.label}
                          </p>
                          <p className="text-sm text-industrial-600 mt-0.5">
                            {activity.description}
                          </p>
                        </div>
                        <span className="text-xs text-industrial-400 whitespace-nowrap">
                          {formatRelativeTime(activity.createdAt)}
                        </span>
                      </div>

                      {/* Metadata tags */}
                      {Object.keys(activity.metadata).length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {Object.entries(activity.metadata).map(([key, value]) => (
                            <span
                              key={key}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-industrial-100 text-industrial-600"
                            >
                              <span className="text-industrial-400 mr-1">
                                {key}:
                              </span>
                              {value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Load more button */}
              <div className="pt-4 text-center">
                <Button variant="outline" size="sm">
                  Load More
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
