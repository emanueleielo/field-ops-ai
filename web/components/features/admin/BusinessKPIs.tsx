"use client";

import {
  DollarSign,
  TrendingUp,
  Users,
  UserMinus,
  UserPlus,
  Building2,
} from "lucide-react";
import { KPICard } from "./KPICard";
import { BusinessKPIs as BusinessKPIsData } from "@/lib/api/admin-client";

interface BusinessKPIsProps {
  data: BusinessKPIsData | null;
  isLoading?: boolean;
}

/**
 * Grid of business KPI cards
 * Displays MRR, ARR, Active Users, Churn, ARPU, New Users
 */
export function BusinessKPIs({ data, isLoading }: BusinessKPIsProps) {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-industrial-900">
          Business Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-industrial border border-industrial-200 bg-white p-4 h-24 animate-pulse"
            >
              <div className="h-3 bg-industrial-200 rounded w-1/3 mb-3" />
              <div className="h-6 bg-industrial-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-industrial-900 flex items-center gap-2">
        <div className="w-1 h-5 bg-warning-500 rounded-full" />
        Business Metrics
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard
          title="Monthly Recurring Revenue"
          value={formatCurrency(data?.mrr || 0)}
          subtitle="MRR"
          icon={DollarSign}
          variant="warning"
        />
        <KPICard
          title="Annual Recurring Revenue"
          value={formatCurrency(data?.arr || 0)}
          subtitle="ARR"
          icon={TrendingUp}
        />
        <KPICard
          title="Active Users"
          value={data?.active_users || 0}
          subtitle="With active subscriptions"
          icon={Users}
          variant="success"
        />
        <KPICard
          title="Churn Rate"
          value={formatPercentage(data?.churn_rate || 0)}
          subtitle="Last 30 days"
          icon={UserMinus}
          variant={
            (data?.churn_rate || 0) > 5
              ? "danger"
              : (data?.churn_rate || 0) > 2
                ? "warning"
                : "default"
          }
        />
        <KPICard
          title="Average Revenue Per User"
          value={formatCurrency(data?.arpu || 0)}
          subtitle="ARPU"
          icon={DollarSign}
        />
        <KPICard
          title="New Users This Month"
          value={data?.new_users_this_month || 0}
          icon={UserPlus}
          variant="success"
        />
        <KPICard
          title="Total Organizations"
          value={data?.total_organizations || 0}
          subtitle="All time"
          icon={Building2}
        />
      </div>
    </div>
  );
}
