"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

export function LikeButton({
  slug,
  initialLiked,
  initialCount,
  signedIn,
}: {
  slug: string;
  initialLiked: boolean;
  initialCount: number;
  signedIn: boolean;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, startTransition] = useTransition();

  if (!signedIn) {
    return (
      <Link
        href={`/login?next=/posts/${slug}`}
        className="btn-ghost"
        title="Sign in to like this post"
      >
        ♥ {count} <span className="text-xs text-slate-400">Sign in to like</span>
      </Link>
    );
  }

  async function toggle() {
    const previous = { liked, count };
    setLiked(!liked);
    setCount(count + (liked ? -1 : 1));
    const response = await fetch(`/api/posts/${encodeURIComponent(slug)}/like`, { method: "POST" });
    if (!response.ok) {
      setLiked(previous.liked);
      setCount(previous.count);
      return;
    }
    const data = (await response.json()) as { liked: boolean; likeCount: number };
    startTransition(() => {
      setLiked(data.liked);
      setCount(data.likeCount);
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={liked ? "btn-primary" : "btn-ghost"}
      aria-pressed={liked}
    >
      <span className={liked ? "text-white" : "text-rose-300"}>{liked ? "♥" : "♡"}</span>
      {count}
      <span className="text-xs opacity-80">{liked ? "Liked" : "Like"}</span>
    </button>
  );
}
