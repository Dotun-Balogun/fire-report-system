import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-neutral-900 text-white hover:bg-neutral-800 focus-visible:ring-neutral-900",
        emergency:
          "bg-red-600 text-white shadow-lg shadow-red-600/30 hover:bg-red-700 active:scale-[0.99] focus-visible:ring-red-600",
        outline: "border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50",
        ghost: "text-neutral-700 hover:bg-neutral-100",
      },
      size: {
        default: "h-11 px-5",
        lg: "h-14 px-6 text-base",
        sm: "h-9 px-3 text-sm",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);
Button.displayName = "Button";
