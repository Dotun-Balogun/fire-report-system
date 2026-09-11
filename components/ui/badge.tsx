import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", {
  variants: {
    variant: {
      neutral: "bg-neutral-100 text-neutral-700",
      received: "bg-blue-100 text-blue-700",
      verified: "bg-amber-100 text-amber-700",
      dispatched: "bg-orange-100 text-orange-700",
      resolved: "bg-green-100 text-green-700",
      small: "bg-amber-100 text-amber-700",
      spreading: "bg-orange-100 text-orange-700",
      major: "bg-red-100 text-red-700",
    },
  },
  defaultVariants: { variant: "neutral" },
});

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
