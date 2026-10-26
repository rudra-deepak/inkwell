"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { PublicUser } from "@/lib/store";
import { Avatar } from "./avatar";
import { DeveloperBadge } from "./developer-badge";

export function UserMenu({ user }: { user: PublicUser }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function signOut() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" });
    setBusy(false);
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] p-1 pr-3 transition hover:border-white/25"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar name={user.name} color={user.avatarColor} image={user.avatarImage} verified={user.verified} size="sm" />
        <span className="hidden text-sm font-medium text-slate-200 sm:inline">{user.name.split(" ")[0]}</span>
      </button>

      {open ? (
        <div
          role="menu"
          className="card absolute right-0 z-30 mt-2 w-60 overflow-hidden border-white/15 bg-ink-900/95 p-2 shadow-2xl shadow-black/50"
        >
          <div className="px-3 py-2">
            <p className="text-sm font-semibold text-white">{user.name}  <DeveloperBadge email={user.email} /></p>
            <p className="truncate text-xs text-slate-400">{user.email}</p>
          </div>
          <div className="my-1 h-px bg-white/10" />
          <Link
            href={`/authors/${user.handle}`}
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
          >
            My profile
          </Link>
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
          >
            Dashboard · {user.postCount} posts
          </Link>
          <Link
            href="/new"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
          >
            New post
          </Link>
          <div className="my-1 h-px bg-white/10" />
          <button
            type="button"
            onClick={signOut}
            disabled={busy}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-rose-300 hover:bg-rose-500/10 disabled:opacity-60"
          >
            {busy ? "Signing out…" : "Sign out"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
