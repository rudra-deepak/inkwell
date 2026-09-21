"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type Tag = { tag: string; count: number };

export function FeedControls({ tags }: { tags: Tag[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const activeTag = params.get("tag") ?? "";
  const activeSort = params.get("sort") ?? "recent";
  const [query, setQuery] = useState(params.get("q") ?? "");

  useEffect(() => {
    setQuery(params.get("q") ?? "");
  }, [params]);

  function push(next: Record<string, string | null>) {
    const search = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (!value) search.delete(key);
      else search.set(key, value);
    }
    const qs = search.toString();
    router.push(qs ? `/?${qs}` : "/");
  }

  return (
    <div className="card flex flex-col gap-4 p-4 sm:p-5">
      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
        onSubmit={(event) => {
          event.preventDefault();
          push({ q: query.trim() || null });
        }}
      >
        <div className="relative flex-1">
          <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-500">⌕</span>
          <input
            className="field pl-10"
            placeholder="Search posts, tags, authors…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search posts"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            className="field w-auto cursor-pointer py-2.5"
            value={activeSort}
            onChange={(event) => push({ sort: event.target.value === "recent" ? null : event.target.value })}
            aria-label="Sort posts"
          >
            <option value="recent">Newest</option>
            <option value="popular">Most liked</option>
            <option value="discussed">Most discussed</option>
          </select>
          <button type="submit" className="btn-primary">
            Search
          </button>
        </div>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <Link href="/" className={`chip ${!activeTag ? "chip-active" : ""}`}>
          All topics
        </Link>
        {tags.slice(0, 8).map((tag) => (
          <Link
            key={tag.tag}
            href={`/?tag=${encodeURIComponent(tag.tag)}${activeSort !== "recent" ? `&sort=${activeSort}` : ""}`}
            className={`chip ${activeTag === tag.tag ? "chip-active" : ""}`}
          >
            #{tag.tag}
            <span className="text-[10px] opacity-70">{tag.count}</span>
          </Link>
        ))}
        {activeTag || params.get("q") ? (
          <button type="button" onClick={() => router.push("/")} className="chip">
            Clear filters ✕
          </button>
        ) : null}
      </div>
    </div>
  );
}
