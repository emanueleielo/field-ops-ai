"use client";

import {
  MessageSquare,
  Send,
  Coins,
  AlertTriangle,
  Clock,
  FileText,
  Phone,
} from "lucide-react";
import { KPICard } from "./KPICard";
import { TechnicalKPIs as TechnicalKPIsData } from "@/lib/api/admin-client";

interface TechnicalKPIsProps {
  data: TechnicalKPIsData | null;
  isLoading?: boolean;
}

/**
 * Grid of technical KPI cards
 * Displays Queries Today, SMS Sent, LLM Costs, Error Rate, Avg Response Time
 */
export function TechnicalKPIs({ data, isLoading }: TechnicalKPIsProps) {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) {
      return `${ms.toFixed(0)}ms`;
    }
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-industrial-900">
          Technical Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(7)].map((_, i) => (
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
        <div className="w-1 h-5 bg-industrial-500 rounded-full" />
        Technical Metrics
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <KPICard
          title="Queries Today"
          value={data?.queries_today || 0}
          subtitle="AI queries processed"
          icon={MessageSquare}
        />
        <KPICard
          title="SMS Sent Today"
          value={data?.sms_sent_today || 0}
          subtitle="Outbound messages"
          icon={Send}
          variant="warning"
        />
        <KPICard
          title="LLM Cost Today"
          value={formatCurrency(data?.llm_cost_today || 0)}
          subtitle="API costs"
          icon={Coins}
          variant={
            (data?.llm_cost_today || 0) > 50
              ? "danger"
              : (data?.llm_cost_today || 0) > 20
                ? "warning"
                : "default"
          }
        />
        <KPICard
          title="Error Rate"
          value={formatPercentage(data?.error_rate || 0)}
          subtitle="Last 24 hours"
          icon={AlertTriangle}
          variant={
            (data?.error_rate || 0) > 5
              ? "danger"
              : (data?.error_rate || 0) > 1
                ? "warning"
                : "success"
          }
        />
        <KPICard
          title="Avg Response Time"
          value={formatDuration(data?.avg_response_time_ms || 0)}
          subtitle="Query to SMS"
          icon={Clock}
          variant={
            (data?.avg_response_time_ms || 0) > 30000
              ? "danger"
              : (data?.avg_response_time_ms || 0) > 15000
                ? "warning"
                : "success"
          }
        />
        <KPICard
          title="Documents Indexed"
          value={data?.documents_indexed || 0}
          subtitle="Total in system"
          icon={FileText}
        />
        <KPICard
          title="Active Phone Numbers"
          value={data?.active_phone_numbers || 0}
          subtitle="Registered numbers"
          icon={Phone}
          variant="success"
        />
      </div>
    </div>
  );
}
