import Link from "next/link";
import type { PublicUser } from "@/lib/store";
import { HeaderNav } from "./header-nav";
import { UserMenu } from "./user-menu";

export function SiteHeader({ user }: { user: PublicUser | null }) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-ink-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 font-serif text-lg font-bold text-white shadow-lg shadow-violet-900/40">
            I
          </span>
          <span className="font-serif text-xl font-semibold tracking-tight text-white">Inkwell</span>
          <span className="hidden rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase sm:inline">
            local-first
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <HeaderNav signedIn={Boolean(user)} />
          {user ? (
            <>
              <Link href="/new" className="btn-primary btn-sm hidden sm:inline-flex">
                Write a post
              </Link>
              <UserMenu user={user} />
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost btn-sm">
                Sign in
              </Link>
              <Link href="/register" className="btn-primary btn-sm">
                Join
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
