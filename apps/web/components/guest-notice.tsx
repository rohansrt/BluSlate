import { Info } from "lucide-react";

/** Shown to guests: their startups live in this browser only (docs/decisions/0002). */
export function GuestNotice() {
  return (
    <p className="flex items-start gap-2 rounded-xl bg-review-soft px-4 py-3 text-sm text-review">
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>
        No account needed for now. Your startups are saved privately to this browser. If you clear
        this site&apos;s cookies, you&apos;ll lose access to them.
      </span>
    </p>
  );
}
