import * as React from "react";
import { cn } from "../cn";

/** Form label. Callers pass `htmlFor` to tie it to its control. */
export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={cn("text-sm font-semibold text-foreground", className)} {...props} />;
}
