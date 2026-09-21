"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeletePostButton({
  slug,
  redirectTo = "/dashboard",
  label = "Delete post",
  className = "btn-ghost btn-sm text-rose-300 hover:border-rose-400/50 hover:bg-rose-500/10",
}: {
  slug: string;
  redirectTo?: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    if (!window.confirm("Delete this post permanently? Comments on it will go too.")) return;
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/posts/${encodeURIComponent(slug)}`, { method: "DELETE" });
    setBusy(false);
    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Could not delete the post.");
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button type="button" onClick={remove} disabled={busy} className={className}>
        {busy ? "Deleting…" : label}
      </button>
      {error ? <span className="text-xs text-rose-300">{error}</span> : null}
    </span>
  );
}
