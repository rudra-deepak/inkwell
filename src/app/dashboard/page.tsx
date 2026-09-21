import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getUserDashboard } from "@/lib/store";
import { Avatar, timeAgo } from "@/components/avatar";
import { DeletePostButton } from "@/components/delete-post-button";
import { ProfileForm } from "@/components/profile-form";
import { VerificationRequestForm } from "@/components/verification-request-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  const { posts, comments, totals } = await getUserDashboard(user.id);

  const stats = [
    { label: "Posts", value: totals.posts },
    { label: "Published", value: totals.published },
    { label: "Drafts", value: totals.drafts },
    { label: "Views", value: totals.views },
    { label: "Likes received", value: totals.likesReceived },
    { label: "Comments written", value: totals.commentsWritten },
  ];

  return (
    <div className="space-y-8 pt-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={user.name} color={user.avatarColor} image={user.avatarImage} verified={user.verified} size="lg" />
          <div>
            <p className="text-xs font-semibold tracking-wider text-violet-300 uppercase">Dashboard</p>
            <h1 className="font-serif text-3xl font-semibold text-white">{user.name}</h1>
            <p className="text-sm text-slate-400">
              @{user.handle} · member since {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/authors/${user.handle}`} className="btn-ghost">
            Public profile
          </Link>
          <Link href="/new" className="btn-primary">
            New post
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">{stat.label}</p>
            <p className="font-serif text-2xl text-white">{stat.value}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-2xl font-semibold text-white">Your posts</h2>
            <span className="text-xs text-slate-400">{posts.length} total</span>
          </div>

          {posts.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-sm text-slate-300">You have not written anything yet.</p>
              <Link href="/new" className="btn-primary mt-4">
                Write your first post
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {posts.map((post) => (
                <li key={post.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/posts/${post.slug}`}
                        className="font-serif text-lg font-semibold text-white hover:text-violet-200"
                      >
                        {post.title}
                      </Link>
                      {post.status === "draft" ? (
                        <span className="rounded-full bg-amber-400/90 px-2 py-0.5 text-[10px] font-bold text-amber-950 uppercase">
                          Draft
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      Updated {timeAgo(post.updatedAt)} · 👁 {post.views} · ♥ {post.likeCount} · 💬 {post.commentCount}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <span key={tag} className="text-[11px] text-violet-300">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link href={`/posts/${post.slug}/edit`} className="btn-ghost btn-sm">
                      Edit
                    </Link>
                    <DeletePostButton slug={post.slug} label="Delete" />
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="card p-5">
            <h3 className="font-serif text-xl font-semibold text-white">Comments you have written</h3>
            {comments.length === 0 ? (
              <p className="mt-2 text-sm text-slate-400">No comments yet — the fastest way to get readers is to comment.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {comments.slice(0, 6).map((comment) => (
                  <li key={comment.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                    <p className="text-sm leading-relaxed text-slate-300">{comment.body}</p>
                    <p className="mt-2 text-[11px] text-slate-500">
                      {timeAgo(comment.createdAt)}
                      {comment.parentId ? " · reply" : ""} ·{" "}
                      <Link href={`/posts/${comment.postId}#comments`} className="text-violet-300 hover:text-violet-200">
                        view thread
                      </Link>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <ProfileForm user={user} />
          <VerificationRequestForm />
          <div className="card p-5 text-sm text-slate-400">
            <p className="font-semibold text-slate-200">How auth works here</p>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed">
              <li>• Signing in issues a random 64-char session token.</li>
              <li>• The token is stored in an httpOnly cookie, unreadable from JS.</li>
              <li>• Sessions live in the local JSON store and can be revoked instantly.</li>
              <li>• Passwords use scrypt with a per-user salt — never stored in plain text.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
