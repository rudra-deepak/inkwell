import Link from "next/link";
import type { PostView } from "@/lib/store";
import { Avatar, timeAgo } from "./avatar";

export function TagList({ tags, active }: { tags: string[]; active?: string }) {
  if (!tags.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((tag) => (
        <Link
          key={tag}
          href={`/?tag=${encodeURIComponent(tag)}`}
          className={`chip ${active === tag ? "chip-active" : ""}`}
        >
          #{tag}
        </Link>
      ))}
    </div>
  );
}

export function PostCard({ post, featured = false }: { post: PostView; featured?: boolean }) {
  return (
    <article
      className={`card group flex flex-col overflow-hidden transition hover:border-violet-400/40 hover:bg-white/[0.06] ${
        featured ? "lg:flex-row" : ""
      }`}
    >
      <Link
        href={`/posts/${post.slug}`}
        className={`relative block overflow-hidden bg-gradient-to-br from-violet-600/30 via-fuchsia-600/20 to-sky-500/20 ${
          featured ? "h-48 lg:h-auto lg:w-1/2" : "h-40"
        }`}
      >
        {post.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverImage}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
          />
        ) : (
          <div className="grid h-full w-full place-items-center font-serif text-3xl text-white/70">
            {post.title.slice(0, 1)}
          </div>
        )}
        {post.status === "draft" ? (
          <span className="absolute top-3 left-3 rounded-full bg-amber-400/90 px-2.5 py-1 text-[10px] font-bold tracking-wide text-amber-950 uppercase">
            Draft
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <TagList tags={post.tags.slice(0, 3)} />

        <h3 className={`font-serif font-semibold text-white ${featured ? "text-2xl" : "text-lg"}`}>
          <Link href={`/posts/${post.slug}`} className="transition hover:text-violet-200">
            {post.title}
          </Link>
        </h3>

        <p className="line-clamp-3 text-sm leading-relaxed text-slate-400">{post.excerpt}</p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2.5">
            <Avatar
              name={post.author.name}
              color={post.author.avatarColor}
              image={post.author.avatarImage}
              verified={post.author.verified}
              size="sm"
              href={`/authors/${post.author.handle}`}
            />
            <div className="leading-tight">
              <Link href={`/authors/${post.author.handle}`} className="text-xs font-semibold text-slate-200 hover:text-white">
                {post.author.name}
              </Link>
              <p className="text-[11px] text-slate-500">
                {timeAgo(post.createdAt)} · {post.readingMinutes} min read
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span title="Comments">💬 {post.commentCount}</span>
            <span title="Likes">♥ {post.likeCount}</span>
            <span title="Views" className="hidden sm:inline">
              👁 {post.views}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
