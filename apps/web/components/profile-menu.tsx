"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  FolderOpen,
  Handshake,
  LogOut,
  MessageSquareHeart,
  NotebookPen,
  ShieldCheck,
  UserPlus,
  UserRound,
  Users,
} from "lucide-react";
import { cn } from "@bluslate/ui";
import { signOutAction } from "@/lib/auth-actions";

/**
 * The top-right profile menu (docs/decisions/0011): My startups, Collaborate,
 * Consult, Idea Book, Feedback, then Profile, Admin (admins) and Log out.
 */
export function ProfileMenu({
  name,
  email,
  isGuest,
  isAdmin,
  pendingFriends = 0,
}: {
  name: string | null;
  email: string | null;
  isGuest: boolean;
  isAdmin: boolean;
  /** Friend requests waiting for an answer (Collaborate). */
  pendingFriends?: number;
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
          <Link role="menuitem" href="/collaborate" className={item} onClick={() => setOpen(false)}>
            <Users className="size-4" aria-hidden /> Collaborate
            {pendingFriends > 0 && (
              <span
                className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground"
                aria-label={`${pendingFriends} new requests`}
              >
                {pendingFriends}
              </span>
            )}
          </Link>
          <Link role="menuitem" href="/consult" className={item} onClick={() => setOpen(false)}>
            <Handshake className="size-4" aria-hidden /> Consult
          </Link>
          <Link role="menuitem" href="/ideas" className={item} onClick={() => setOpen(false)}>
            <NotebookPen className="size-4" aria-hidden /> Idea Book
          </Link>
          <Link role="menuitem" href="/feedback" className={item} onClick={() => setOpen(false)}>
            <MessageSquareHeart className="size-4" aria-hidden /> Feedback
          </Link>
          <div className="my-1 h-px bg-border" />
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
              <LogOut className="size-4" aria-hidden /> {isGuest ? "End guest session" : "Log out"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
