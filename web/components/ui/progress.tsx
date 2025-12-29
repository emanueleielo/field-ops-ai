import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  variant?: "default" | "warning" | "danger" | "success";
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value,
      max = 100,
      variant = "default",
      showValue = false,
      size = "md",
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    const sizeClasses = {
      sm: "h-1.5",
      md: "h-3",
      lg: "h-4",
    };

    const variantClasses = {
      default: "bg-industrial-600",
      warning: "bg-warning-500",
      danger: "bg-danger-500",
      success: "bg-success-500",
    };

    // Auto-determine variant based on percentage if default
    const autoVariant =
      variant === "default"
        ? percentage >= 100
          ? "danger"
          : percentage >= 90
            ? "warning"
            : "default"
        : variant;

    return (
      <div className={cn("w-full", className)} {...props} ref={ref}>
        <div
          className={cn(
            "w-full overflow-hidden rounded-full gauge-track",
            sizeClasses[size]
          )}
        >
          <div
            className={cn(
              "h-full transition-all duration-500 ease-out rounded-full",
              variantClasses[autoVariant]
            )}
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={max}
          />
        </div>
        {showValue && (
          <div className="mt-1 flex justify-between text-xs font-mono text-industrial-500">
            <span>{value.toFixed(0)}</span>
            <span>/ {max}</span>
          </div>
        )}
      </div>
    );
  }
);
Progress.displayName = "Progress";

export { Progress };
