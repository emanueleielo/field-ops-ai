import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded border bg-white px-3 py-2 text-sm transition-all",
          "border-industrial-300 text-industrial-900 placeholder:text-industrial-400",
          "focus:outline-none focus:ring-2 focus:ring-warning-500/30 focus:border-warning-500",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-industrial-50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          error && "border-danger-500 focus:ring-danger-500/30 focus:border-danger-500",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
