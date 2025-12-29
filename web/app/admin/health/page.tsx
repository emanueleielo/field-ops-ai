"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  AlertCircle,
  Database,
  Cloud,
  Phone,
  Bot,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Activity,
  FileText,
  type LucideIcon,
} from "lucide-react";
import { ServiceStatusCard, LogViewer } from "@/components/features/admin";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  adminApi,
  HealthResponse,
  ServiceStatusType,
  LogsResponse,
} from "@/lib/api/admin-client";

const serviceIcons: Record<string, LucideIcon> = {
  database: Database,
  qdrant: Cloud,
  twilio: Phone,
  llm: Bot,
};

const statusConfig: Record<
  ServiceStatusType,
  { icon: React.ElementType; label: string; color: string }
> = {
  healthy: {
    icon: CheckCircle,
    label: "All Systems Operational",
    color: "text-success-600",
  },
  degraded: {
    icon: AlertTriangle,
    label: "Some Services Degraded",
    color: "text-warning-600",
  },
  down: {
    icon: XCircle,
    label: "Services Down",
    color: "text-danger-600",
  },
  unknown: {
    icon: AlertCircle,
    label: "Status Unknown",
    color: "text-industrial-600",
  },
};

/**
 * Admin health monitoring page
 * Displays service status and application logs
 */
export default function AdminHealthPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [logs, setLogs] = useState<LogsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    setError(null);

    try {
      const [healthData, logsData] = await Promise.all([
        adminApi.getHealth(),
        adminApi.getLogs(1, 50),
      ]);
      setHealth(healthData);
      setLogs(logsData);
      setLastUpdated(new Date());
    } catch (err) {
      const apiError = err as { detail?: string };
      setError(apiError.detail || "Failed to load health status");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Auto-refresh every 60 seconds
    const interval = setInterval(() => fetchData(false), 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  if (error && isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-danger-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-industrial-900 mb-2">
            Failed to Load Health Status
          </h2>
          <p className="text-industrial-600 mb-4">{error}</p>
          <Button onClick={() => fetchData()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const overallConfig = health
    ? statusConfig[health.overall_status]
    : statusConfig.unknown;
  const OverallIcon = overallConfig.icon;

  return (
    <div className="space-y-8">
      {/* Header with overall status */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-industrial-900">
            System Health
          </h1>
          <p className="text-industrial-600 mt-1">
            Monitor service status and application logs
          </p>

          {/* Overall status badge */}
          {health && (
            <div
              className={cn(
                "inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full",
                health.overall_status === "healthy"
                  ? "bg-success-50 border border-success-200"
                  : health.overall_status === "degraded"
                    ? "bg-warning-50 border border-warning-200"
                    : health.overall_status === "down"
                      ? "bg-danger-50 border border-danger-200"
                      : "bg-industrial-50 border border-industrial-200"
              )}
            >
              <OverallIcon className={cn("w-5 h-5", overallConfig.color)} />
              <span className={cn("font-medium", overallConfig.color)}>
                {overallConfig.label}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-industrial-500">
              Last checked: {formatTime(lastUpdated)}
            </span>
          )}
          <Button
            onClick={() => fetchData(true)}
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
            onClick={() => fetchData(true)}
            variant="ghost"
            size="sm"
            className="ml-auto text-danger-700 hover:text-danger-800 hover:bg-danger-100"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Service Status Cards */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-warning-600" />
          <h2 className="text-lg font-semibold text-industrial-900">
            Service Status
          </h2>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="animate-pulse bg-white rounded-industrial border border-industrial-200 p-4 h-40"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-industrial-100" />
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-industrial-100 rounded" />
                    <div className="h-3 w-16 bg-industrial-100 rounded" />
                  </div>
                </div>
                <div className="h-3 w-32 bg-industrial-100 rounded" />
              </div>
            ))}
          </div>
        ) : health ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(health.services).map(([key, service]) => (
              <ServiceStatusCard
                key={key}
                service={service}
                icon={serviceIcons[key] || Cloud}
              />
            ))}
          </div>
        ) : null}
      </div>

      {/* Application Logs */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-warning-600" />
          <h2 className="text-lg font-semibold text-industrial-900">
            Application Logs
          </h2>
        </div>
        <LogViewer logs={logs?.logs || []} isLoading={isLoading} />
      </div>

      {/* Auto-refresh indicator */}
      <div className="flex items-center justify-center gap-2 text-xs text-industrial-400 pt-4">
        <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
        <span>Auto-refreshing every 60 seconds</span>
      </div>
    </div>
  );
}
