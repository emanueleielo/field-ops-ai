import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-industrial text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-industrial-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-industrial-900 text-white hover:bg-industrial-800 active:bg-industrial-950",
        destructive:
          "bg-danger-600 text-white hover:bg-danger-700 active:bg-danger-800",
        outline:
          "border border-industrial-300 bg-white text-industrial-900 hover:bg-industrial-50 active:bg-industrial-100",
        secondary:
          "bg-industrial-100 text-industrial-900 hover:bg-industrial-200 active:bg-industrial-300",
        ghost:
          "text-industrial-700 hover:bg-industrial-100 active:bg-industrial-200",
        link: "text-industrial-900 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
