import Image from "next/image";
import Link from "next/link";
import { cn } from "@bluslate/ui";

/** The BluSlate logo, switching artwork with the system light/dark theme. */
export function Logo({ className, height = 32 }: { className?: string; height?: number }) {
  return (
    <Link
      href="/"
      className={cn("inline-flex shrink-0 items-center", className)}
      aria-label="BluSlate home"
    >
      <Image
        src="/brand/logo-light.png"
        alt="BluSlate"
        width={Math.round((614 / 160) * height)}
        height={height}
        priority
        className="dark:hidden"
      />
      <Image
        src="/brand/logo-dark.png"
        alt="BluSlate"
        width={Math.round((569 / 160) * height)}
        height={height}
        priority
        className="hidden dark:block"
      />
    </Link>
  );
}
