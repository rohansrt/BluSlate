"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, FolderOpen, LogOut, ShieldCheck, UserRound, UserPlus } from "lucide-react";
import { cn } from "@bluslate/ui";
import { signOutAction } from "@/lib/auth-actions";

/** The top-right profile menu: who you are, your startups, profile, admin, sign out. */
export function ProfileMenu({
  name,
  email,
  isGuest,
  isAdmin,
}: {
  name: string | null;
  email: string | null;
  isGuest: boolean;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const label = name || (isGuest ? "Guest" : email) || "You";
  const initial = (name || email || "G").trim().charAt(0).toUpperCase();
  const item =
    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${label}`}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-2.5 text-sm font-medium shadow-sm hover:bg-accent"
      >
        <span className="grid size-7 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {initial}
        </span>
        <span className="hidden max-w-[10rem] truncate sm:inline">{label}</span>
        <ChevronDown
          className={cn("size-4 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 z-50 mt-2 w-64 rounded-2xl border border-border bg-popover p-2 shadow-xl"
        >
          <div className="px-3 pb-2 pt-1.5">
            <p className="truncate text-sm font-semibold">{label}</p>
            <p className="truncate text-xs text-muted-foreground">
              {isGuest ? "Guest: saved in this browser only" : email}
            </p>
          </div>
          <div className="my-1 h-px bg-border" />
          <Link role="menuitem" href="/startups" className={item} onClick={() => setOpen(false)}>
            <FolderOpen className="size-4" aria-hidden /> My startups
          </Link>
          <Link role="menuitem" href="/profile" className={item} onClick={() => setOpen(false)}>
            <UserRound className="size-4" aria-hidden /> Profile
          </Link>
          {isAdmin && (
            <Link role="menuitem" href="/admin" className={item} onClick={() => setOpen(false)}>
              <ShieldCheck className="size-4" aria-hidden /> Admin dashboard
            </Link>
          )}
          {isGuest && (
            <Link
              role="menuitem"
              href="/signin?mode=signup"
              className={cn(item, "font-semibold text-primary")}
              onClick={() => setOpen(false)}
            >
              <UserPlus className="size-4" aria-hidden /> Sign up to keep your work
            </Link>
          )}
          <div className="my-1 h-px bg-border" />
          <form
            action={signOutAction}
            onSubmit={(e) => {
              if (
                isGuest &&
                !window.confirm(
                  "End the guest session? Without signing up first, you'll lose access to your startups.",
                )
              ) {
                e.preventDefault();
              }
            }}
          >
            <button role="menuitem" type="submit" className={item}>
              <LogOut className="size-4" aria-hidden /> {isGuest ? "End guest session" : "Sign out"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
