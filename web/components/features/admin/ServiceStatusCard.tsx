"use client";

import { ServiceStatus, ServiceStatusType } from "@/lib/api/admin-client";
import { cn } from "@/lib/utils";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Clock,
  LucideIcon,
} from "lucide-react";

interface ServiceStatusCardProps {
  service: ServiceStatus;
  icon: LucideIcon;
  className?: string;
}

const statusConfig: Record<
  ServiceStatusType,
  { icon: LucideIcon; color: string; bgColor: string; label: string }
> = {
  healthy: {
    icon: CheckCircle,
    color: "text-success-600",
    bgColor: "bg-success-50 border-success-200",
    label: "Healthy",
  },
  degraded: {
    icon: AlertTriangle,
    color: "text-warning-600",
    bgColor: "bg-warning-50 border-warning-200",
    label: "Degraded",
  },
  down: {
    icon: XCircle,
    color: "text-danger-600",
    bgColor: "bg-danger-50 border-danger-200",
    label: "Down",
  },
  unknown: {
    icon: HelpCircle,
    color: "text-industrial-500",
    bgColor: "bg-industrial-50 border-industrial-200",
    label: "Unknown",
  },
};

/**
 * Service status card component
 * Displays health status for individual services (Database, Qdrant, Twilio, LLM)
 */
export function ServiceStatusCard({
  service,
  icon: ServiceIcon,
  className,
}: ServiceStatusCardProps) {
  const config = statusConfig[service.status];
  const StatusIcon = config.icon;

  const formatLatency = (ms: number | null): string => {
    if (ms === null) return "-";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTime = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div
      className={cn(
        "rounded-industrial border p-4 shadow-industrial transition-shadow hover:shadow-industrial-md",
        config.bgColor,
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "p-2 rounded-lg",
              service.status === "healthy"
                ? "bg-success-100"
                : service.status === "degraded"
                  ? "bg-warning-100"
                  : service.status === "down"
                    ? "bg-danger-100"
                    : "bg-industrial-100"
            )}
          >
            <ServiceIcon className="w-5 h-5 text-industrial-700" />
          </div>
          <div>
            <h3 className="font-semibold text-industrial-900">{service.name}</h3>
            <div className="flex items-center gap-1 mt-0.5">
              <StatusIcon className={cn("w-4 h-4", config.color)} />
              <span className={cn("text-sm font-medium", config.color)}>
                {config.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {service.message && (
        <p className="text-sm text-industrial-600 mb-3">{service.message}</p>
      )}

      <div className="flex items-center justify-between text-xs text-industrial-500">
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span>Last checked: {formatTime(service.last_checked)}</span>
        </div>
        {service.latency_ms !== null && (
          <span className="font-mono">{formatLatency(service.latency_ms)}</span>
        )}
      </div>

      {/* Show additional details if available */}
      {service.details && Object.keys(service.details).length > 0 && (
        <div className="mt-3 pt-3 border-t border-industrial-200">
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(service.details)
              .filter(([key]) => key !== "providers")
              .map(([key, value]) => (
                <div key={key} className="text-xs">
                  <span className="text-industrial-500 capitalize">
                    {key.replace(/_/g, " ")}:
                  </span>{" "}
                  <span className="font-medium text-industrial-700">
                    {typeof value === "number"
                      ? value.toLocaleString()
                      : String(value)}
                  </span>
                </div>
              ))}
          </div>
          {/* LLM Providers detail */}
          {(() => {
            const providers = service.details?.providers;
            if (!providers || !Array.isArray(providers)) return null;
            return (
              <div className="mt-2 space-y-1">
                {(providers as Array<{
                  name: string;
                  status: ServiceStatusType;
                  api_key_valid: boolean;
                }>).map((provider) => (
                  <div
                    key={provider.name}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-industrial-600">{provider.name}</span>
                    <div className="flex items-center gap-2">
                      {!provider.api_key_valid && (
                        <span className="text-industrial-400">No API key</span>
                      )}
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded text-xs font-medium",
                          provider.status === "healthy"
                            ? "bg-success-100 text-success-700"
                            : provider.status === "degraded"
                              ? "bg-warning-100 text-warning-700"
                              : provider.status === "down"
                                ? "bg-danger-100 text-danger-700"
                                : "bg-industrial-100 text-industrial-600"
                        )}
                      >
                        {provider.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
