import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getStats, listPosts, listTags } from "@/lib/store";
import { FeedControls } from "@/components/feed-controls";
import { PostCard } from "@/components/post-card";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string; tag?: string; sort?: string }>;

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const viewer = await getCurrentUser();
  const sort = (params.sort as "recent" | "popular" | "discussed" | undefined) ?? "recent";

  const [posts, tags, stats] = await Promise.all([
    listPosts({
      q: params.q,
      tag: params.tag,
      sort,
      viewerId: viewer?.id ?? null,
    }),
    listTags(),
    getStats(),
  ]);

  const filtered = Boolean(params.q || params.tag);
  const [featured, ...rest] = posts;
  const showFeatured = Boolean(featured) && !filtered && sort === "recent";

  return (
    <div className="space-y-8 pt-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-600/20 via-fuchsia-600/10 to-sky-500/10 px-6 py-10 sm:px-10 sm:py-14">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-950/60 px-3 py-1 font-sans text-xs shadow-[0_0_20px_rgba(0,0,0,0.8)] backdrop-blur-md transition-all duration-300 hover:border-neutral-700 hover:bg-neutral-950">
  <span className="text-neutral-400">
    A local-first blogging platform.
  </span>
  <span className="h-3 w-px bg-neutral-800" />
  <span className="text-neutral-500">By</span>
  <a
    href="http://port-rudra.netlify.app"
    target="_blank"
    rel="noopener noreferrer"
    className="group relative font-semibold text-neutral-300 hover:text-emerald-400 transition-colors"
  >
    @rudra_deepak
    <span className="absolute -bottom-0.5 left-0 h-[1px] w-0 bg-emerald-400 transition-all duration-300 group-hover:w-full" />
  </a>
</div>

    
          <h1 className="mt-4 font-serif text-4xl leading-tight font-semibold text-white sm:text-5xl">
            Write it down. Publish it. Argue about it in the comments.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-300">
            Inkwell is a small blogging platform with real accounts, real editing, and a comment thread
            that stays civil because it is only one level deep. Everything is stored in a single JSON file
            on this machine — sessions included.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href={viewer ? "/new" : "/register"} className="btn-primary">
              {viewer ? "Write a post" : "Create an account"}
            </Link>
            <Link href={viewer ? "/dashboard" : "/login"} className="btn-ghost">
              {viewer ? "Go to dashboard" : "Sign in with a demo account"}
            </Link>
          </div>

          <dl className="mt-8 grid max-w-lg grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Posts", value: stats.posts },
              { label: "Writers", value: stats.writers },
              { label: "Comments", value: stats.comments },
              { label: "Topics", value: stats.tags },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                <dt className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">{item.label}</dt>
                <dd className="font-serif text-xl text-white">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <Suspense fallback={<div className="card h-32 animate-pulse" />}>
        <FeedControls tags={tags} />
      </Suspense>

      {posts.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-serif text-xl text-white">Nothing here yet</p>
          <p className="mt-2 text-sm text-slate-400">
            {filtered
              ? "No posts matched that search. Try a different topic or clear the filters."
              : "Be the first to publish something — the feed is waiting for a first post."}
          </p>
          <Link href={viewer ? "/new" : "/register"} className="btn-primary mt-5">
            {viewer ? "Write the first post" : "Join to write"}
          </Link>
        </div>
      ) : (
        <>
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-2xl font-semibold text-white">
              {filtered ? "Filtered results" : sort === "recent" ? "Latest posts" : "Posts"}
            </h2>
            <span className="text-xs text-slate-400">
              {posts.length} {posts.length === 1 ? "post" : "posts"}
              {params.tag ? ` · #${params.tag}` : ""}
            </span>
          </div>

          {showFeatured ? (
            <div className="space-y-6">
              <PostCard post={featured} featured />
              {rest.length ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
