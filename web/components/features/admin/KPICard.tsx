"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "warning" | "success" | "danger";
  className?: string;
}

/**
 * KPI Card component for displaying single metrics
 * Uses industrial design system with amber accent for admin
 */
export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: KPICardProps) {
  const variantStyles = {
    default: "bg-white border-industrial-200",
    warning: "bg-warning-50 border-warning-200",
    success: "bg-success-50 border-success-200",
    danger: "bg-danger-50 border-danger-200",
  };

  const iconStyles = {
    default: "bg-industrial-100 text-industrial-600",
    warning: "bg-warning-100 text-warning-700",
    success: "bg-success-100 text-success-700",
    danger: "bg-danger-100 text-danger-700",
  };

  return (
    <div
      className={cn(
        "rounded-industrial border p-4 shadow-industrial transition-shadow hover:shadow-industrial-md",
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-industrial-500 uppercase tracking-wider truncate">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold text-industrial-900 tabular-nums">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-industrial-500">{subtitle}</p>
          )}
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              <span
                className={cn(
                  "text-xs font-medium",
                  trend.isPositive ? "text-success-600" : "text-danger-600"
                )}
              >
                {trend.isPositive ? "+" : ""}
                {trend.value}%
              </span>
              <span className="text-xs text-industrial-400">vs last month</span>
            </div>
          )}
        </div>
        <div className={cn("p-2 rounded-lg", iconStyles[variant])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
