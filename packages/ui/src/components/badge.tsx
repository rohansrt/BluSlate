import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../cn";

export const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold tracking-wide",
  {
    variants: {
      variant: {
        neutral: "bg-muted text-muted-foreground",
        founder: "bg-founder-soft text-founder",
        ai: "border border-dashed border-ai bg-ai-soft text-ai",
        enabler: "bg-enabler-soft text-enabler",
        review: "bg-review-soft text-review",
        synthetic: "bg-synthetic-soft text-synthetic",
        actual: "bg-actual-soft text-actual",
        danger: "bg-danger-soft text-danger",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface BadgeProps
  extends React.ComponentProps<"span">, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
