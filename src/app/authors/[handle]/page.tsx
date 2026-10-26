import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { findUserByHandle, listPosts } from "@/lib/store";
import { Avatar, formatDate } from "@/components/avatar";
import { PostCard } from "@/components/post-card";
import { ProfileSocial } from "@/components/profile-social";
import { DeveloperBadge } from "@/components/developer-badge";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const author = await findUserByHandle(handle);
  return { title: author ? `${author.name} (@${author.handle})` : "Author not found" };
}

export default async function AuthorPage({ params }: Props) {
  const { handle } = await params;
  const viewer = await getCurrentUser();
  const author = await findUserByHandle(handle, viewer?.id ?? null);
  if (!author) notFound();
  const posts = await listPosts({ authorHandle: author.handle, viewerId: viewer?.id ?? null });
  const likesReceived = posts.reduce((sum, post) => sum + post.likeCount, 0);

  return (
    <div className="space-y-8 pt-8">
      <header className="card flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={author.name} color={author.avatarColor} image={author.avatarImage} verified={author.verified} size="lg" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-serif text-3xl font-semibold text-white">{author.name}</h1>
              <DeveloperBadge email={author.email} />
            </div>
            <p className="text-sm text-slate-400">@{author.handle} · joined {formatDate(author.createdAt)}</p>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">{author.bio}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <ProfileSocial author={author} signedIn={Boolean(viewer)} isOwnProfile={viewer?.id === author.id} />
          <dl className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: "Posts", value: posts.length },
            { label: "Likes", value: likesReceived },
            { label: "Comments", value: author.commentCount },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-white/10 bg-black/20 px-4 py-2">
              <dt className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">{stat.label}</dt>
              <dd className="font-serif text-xl text-white">{stat.value}</dd>
            </div>
          ))}
          </dl>
        </div>
      </header>

      <section className="space-y-5">
        <h2 className="font-serif text-2xl font-semibold text-white">Published writing</h2>
        {posts.length === 0 ? (
          <p className="card p-6 text-sm text-slate-400">This writer has not published anything yet.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
