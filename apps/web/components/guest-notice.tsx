import Link from "next/link";
import { Info } from "lucide-react";

/** Shown to guests (docs/decisions/0010): their work lives in this browser until they sign in. */
export function GuestNotice() {
  return (
    <p className="flex items-start gap-2 rounded-xl bg-review-soft px-4 py-3 text-sm text-review">
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>
        This is a guest workspace, saved in this browser only.{" "}
        <Link href="/signin?mode=signup" className="font-semibold underline underline-offset-2">
          Sign in with a code
        </Link>{" "}
        to keep these startups and open them on any device.
      </span>
    </p>
  );
}
