"use client";

import { LogEntry } from "@/lib/api/admin-client";
import { cn } from "@/lib/utils";
import { Clock, AlertCircle, AlertTriangle, Info, Bug } from "lucide-react";

interface LogViewerProps {
  logs: LogEntry[];
  isLoading?: boolean;
}

const levelConfig: Record<
  string,
  { icon: React.ElementType; color: string; bgColor: string }
> = {
  ERROR: {
    icon: AlertCircle,
    color: "text-danger-600",
    bgColor: "bg-danger-50",
  },
  WARNING: {
    icon: AlertTriangle,
    color: "text-warning-600",
    bgColor: "bg-warning-50",
  },
  INFO: {
    icon: Info,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  DEBUG: {
    icon: Bug,
    color: "text-industrial-500",
    bgColor: "bg-industrial-50",
  },
};

/**
 * Log viewer component
 * Displays application logs in a scrollable, formatted view
 * Placeholder for MVP - production would integrate with real logging system
 */
export function LogViewer({ logs, isLoading }: LogViewerProps) {
  const formatTimestamp = (isoString: string): string => {
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

  if (isLoading) {
    return (
      <div className="bg-industrial-900 rounded-industrial p-4 h-[400px]">
        <div className="animate-pulse space-y-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex gap-2">
              <div className="h-4 w-16 bg-industrial-700 rounded" />
              <div className="h-4 w-12 bg-industrial-700 rounded" />
              <div
                className="h-4 bg-industrial-700 rounded"
                style={{ width: `${30 + Math.random() * 50}%` }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-industrial-900 rounded-industrial p-8 h-[400px] flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-12 h-12 text-industrial-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-industrial-300 mb-2">
            No logs available
          </h3>
          <p className="text-industrial-500 text-sm">
            Logs will appear here when activity is recorded.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-industrial-900 rounded-industrial overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-industrial-800 border-b border-industrial-700">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-danger-500" />
          <div className="w-3 h-3 rounded-full bg-warning-500" />
          <div className="w-3 h-3 rounded-full bg-success-500" />
        </div>
        <span className="text-xs text-industrial-400 font-mono">
          Application Logs (Last 24h)
        </span>
      </div>

      {/* Log content */}
      <div className="h-[350px] overflow-y-auto p-4 font-mono text-xs scrollbar-industrial">
        <div className="space-y-1.5">
          {logs.map((log, index) => {
            const config = levelConfig[log.level] || levelConfig.INFO;
            const _Icon = config.icon; // Reserved for future use

            return (
              <div
                key={index}
                className={cn(
                  "flex items-start gap-2 p-2 rounded hover:bg-industrial-800/50 transition-colors",
                  log.level === "ERROR" && "bg-danger-900/20"
                )}
              >
                {/* Timestamp */}
                <span className="text-industrial-500 flex-shrink-0 w-20">
                  {formatTimestamp(log.timestamp)}
                </span>

                {/* Level badge */}
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 w-16 text-center",
                    config.bgColor,
                    config.color
                  )}
                >
                  {log.level}
                </span>

                {/* Logger name */}
                <span className="text-industrial-400 flex-shrink-0 truncate max-w-[200px]">
                  [{log.logger}]
                </span>

                {/* Message */}
                <span className="text-industrial-200 flex-1">
                  {log.message}
                </span>

                {/* Extra data */}
                {log.extra && Object.keys(log.extra).length > 0 && (
                  <span className="text-industrial-500 flex-shrink-0">
                    {Object.entries(log.extra)
                      .slice(0, 2)
                      .map(([k, v]) => `${k}=${String(v)}`)
                      .join(" ")}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-industrial-800 border-t border-industrial-700">
        <p className="text-xs text-industrial-500 text-center">
          Note: Log viewer is a placeholder for MVP. In production, this would
          integrate with CloudWatch/Datadog/ELK.
        </p>
      </div>
    </div>
  );
}
