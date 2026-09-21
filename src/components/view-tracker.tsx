"use client";

import { useEffect } from "react";

/** Registers a single view per browser session, so SSR stats stay honest. */
export function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `inkwell:viewed:${slug}`;
    if (typeof window === "undefined" || window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");
    void fetch(`/api/posts/${encodeURIComponent(slug)}/view`, { method: "POST" });
  }, [slug]);

  return null;
}
