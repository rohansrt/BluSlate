import Link from "next/link";
import { Button } from "@bluslate/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-primary">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">We couldn&apos;t find that page</h1>
      <p className="mt-3 text-muted-foreground">
        It may have moved, or it belongs to a startup you don&apos;t have access to.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/startups">My startups</Link>
        </Button>
      </div>
    </div>
  );
}
