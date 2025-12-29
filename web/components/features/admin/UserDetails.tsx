"use client";

import {
  User,
  Phone,
  FileText,
  Calendar,
  CreditCard,
  HardDrive,
  TrendingUp,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserDetailResponse, TierType } from "@/lib/api/admin-client";

interface UserDetailsProps {
  user: UserDetailResponse | null;
  isLoading: boolean;
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
 * Detailed user information card component
 * Displays organization info, quota, documents, and phone numbers
 */
export function UserDetails({ user, isLoading }: UserDetailsProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getQuotaColor = (percentage: number) => {
    if (percentage >= 100) return "bg-danger-500";
    if (percentage >= 80) return "bg-warning-500";
    return "bg-success-500";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "indexed":
        return "bg-success-100 text-success-700";
      case "processing":
        return "bg-warning-100 text-warning-700";
      case "failed":
        return "bg-danger-100 text-danger-700";
      default:
        return "bg-industrial-100 text-industrial-600";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Card>
          <CardHeader>
            <div className="h-6 bg-industrial-200 rounded w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-4 bg-industrial-200 rounded w-60" />
            <div className="h-4 bg-industrial-200 rounded w-48" />
            <div className="h-4 bg-industrial-200 rounded w-52" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="h-6 bg-industrial-200 rounded w-32" />
          </CardHeader>
          <CardContent>
            <div className="h-4 bg-industrial-200 rounded w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <User className="w-12 h-12 mx-auto text-industrial-300 mb-3" />
          <p className="text-industrial-500">User not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Info Card */}
      <Card>
        <CardHeader className="border-b border-industrial-100">
          <CardTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-warning-100 flex items-center justify-center">
              <User className="w-6 h-6 text-warning-600" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span>{user.name}</span>
                <span
                  className={cn(
                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                    tierConfig[user.tier].color
                  )}
                >
                  {tierConfig[user.tier].label}
                </span>
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
              </div>
              <p className="text-sm text-industrial-500 mt-1">{user.email}</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-industrial-400 mt-0.5" />
              <div>
                <p className="text-xs text-industrial-500 uppercase tracking-wider">
                  Created
                </p>
                <p className="text-sm font-medium text-industrial-900">
                  {formatDate(user.created_at)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-industrial-400 mt-0.5" />
              <div>
                <p className="text-xs text-industrial-500 uppercase tracking-wider">
                  Last Updated
                </p>
                <p className="text-sm font-medium text-industrial-900">
                  {formatDate(user.updated_at)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-industrial-400 mt-0.5" />
              <div>
                <p className="text-xs text-industrial-500 uppercase tracking-wider">
                  Billing Day
                </p>
                <p className="text-sm font-medium text-industrial-900">
                  Day {user.billing_day} of month
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-industrial-400 mt-0.5" />
              <div>
                <p className="text-xs text-industrial-500 uppercase tracking-wider">
                  Messages
                </p>
                <p className="text-sm font-medium text-industrial-900">
                  {user.messages_count.toLocaleString()} total
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quota Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-warning-500" />
            Quota Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-industrial-600">
                {user.quota.used_euro.toFixed(2)} / {user.quota.limit_euro.toFixed(2)} EUR
              </span>
              <span
                className={cn(
                  "font-medium",
                  user.quota.percentage >= 100
                    ? "text-danger-600"
                    : user.quota.percentage >= 80
                    ? "text-warning-600"
                    : "text-success-600"
                )}
              >
                {user.quota.percentage.toFixed(1)}%
              </span>
            </div>
            <div className="h-3 bg-industrial-200 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-3 rounded-full transition-all",
                  getQuotaColor(user.quota.percentage)
                )}
                style={{
                  width: `${Math.min(user.quota.percentage, 100)}%`,
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phone Numbers Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="w-5 h-5 text-warning-500" />
            Phone Numbers ({user.phone_numbers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user.phone_numbers.length === 0 ? (
            <p className="text-sm text-industrial-500">
              No phone numbers registered
            </p>
          ) : (
            <div className="space-y-3">
              {user.phone_numbers.map((phone) => (
                <div
                  key={phone.id}
                  className="flex items-center justify-between p-3 bg-industrial-50 rounded"
                >
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-industrial-400" />
                    <span className="font-mono text-sm">{phone.number}</span>
                    {phone.is_primary && (
                      <span className="px-2 py-0.5 bg-warning-100 text-warning-700 rounded text-xs font-medium">
                        Primary
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-industrial-500">
                    Added {formatDate(phone.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-5 h-5 text-warning-500" />
            Documents ({user.documents_count})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user.documents.length === 0 ? (
            <p className="text-sm text-industrial-500">No documents uploaded</p>
          ) : (
            <div className="space-y-2">
              {user.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-industrial-50 rounded"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-industrial-400" />
                    <div>
                      <p className="text-sm font-medium text-industrial-900">
                        {doc.filename}
                      </p>
                      <p className="text-xs text-industrial-500">
                        {formatBytes(doc.file_size_bytes)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium",
                        getStatusBadge(doc.status)
                      )}
                    >
                      {doc.status}
                    </span>
                    <span className="text-xs text-industrial-500">
                      {formatDate(doc.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stripe Info Card */}
      {(user.stripe_customer_id || user.stripe_subscription_id) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-warning-500" />
              Stripe Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {user.stripe_customer_id && (
              <div className="flex items-center gap-3 p-3 bg-industrial-50 rounded">
                <span className="text-sm text-industrial-600">Customer ID:</span>
                <span className="font-mono text-sm text-industrial-900">
                  {user.stripe_customer_id}
                </span>
              </div>
            )}
            {user.stripe_subscription_id && (
              <div className="flex items-center gap-3 p-3 bg-industrial-50 rounded">
                <span className="text-sm text-industrial-600">
                  Subscription ID:
                </span>
                <span className="font-mono text-sm text-industrial-900">
                  {user.stripe_subscription_id}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
