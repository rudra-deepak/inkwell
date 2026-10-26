import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getPostBySlug, listComments, listPosts } from "@/lib/store";
import { Avatar, formatDate } from "@/components/avatar";
import { CommentsSection } from "@/components/comments-section";
import { DeletePostButton } from "@/components/delete-post-button";
import { LikeButton } from "@/components/like-button";
import { PostCard, TagList } from "@/components/post-card";
import { Prose } from "@/components/prose";
import { ViewTracker } from "@/components/view-tracker";
import { DeveloperBadge } from "@/components/developer-badge";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Post not found" };
  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const viewer = await getCurrentUser();
  const post = await getPostBySlug(slug, viewer?.id ?? null);
  if (!post) notFound();

  const comments = await listComments(post.id, viewer?.id ?? null);
  const related = (
    await listPosts({ tag: post.tags[0], viewerId: viewer?.id ?? null, limit: 4 })
  ).filter((item) => item.id !== post.id);

  return (
    <article className="pt-8">
      <ViewTracker slug={post.slug} />

      <nav className="mb-6 flex items-center gap-2 text-xs text-slate-400">
        <Link href="/" className="hover:text-white">
          Feed
        </Link>
        <span>/</span>
        {post.tags[0] ? (
          <Link href={`/?tag=${encodeURIComponent(post.tags[0])}`} className="hover:text-white">
            #{post.tags[0]}
          </Link>
        ) : (
          <span>post</span>
        )}
      </nav>

      <header className="space-y-5">
        <TagList tags={post.tags} active={post.tags[0]} />
        <h1 className="font-serif text-3xl leading-tight font-semibold text-white sm:text-5xl">{post.title}</h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">{post.excerpt}</p>

        <div className="flex flex-wrap items-center justify-between gap-4 border-y border-white/10 py-4">
          <div className="flex items-center gap-3">
            <Avatar
              name={post.author.name} 
              color={post.author.avatarColor}
              image={post.author.avatarImage}
              verified={post.author.verified}
              size="lg"
              href={`/authors/${post.author.handle}`}
            />
            <div>
              <Link href={`/authors/${post.author.handle}`} className="font-semibold text-white hover:text-violet-200">
                {post.author.name}
              </Link>
              <p className="text-xs text-slate-400">
                {formatDate(post.createdAt)} · {post.readingMinutes} min read · {post.views} views
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <LikeButton
              slug={post.slug}
              initialLiked={post.likedByMe}
              initialCount={post.likeCount}
              signedIn={Boolean(viewer)}
            />
            <Link href="#comments" className="btn-ghost">
              💬 {post.commentCount}
              <span className="text-xs text-slate-400">comments</span>
            </Link>
            {post.isAuthor ? (
              <>
                <Link href={`/posts/${post.slug}/edit`} className="btn-ghost btn-sm">
                  Edit
                </Link>
                <DeletePostButton slug={post.slug} redirectTo="/dashboard" label="Delete" />
              </>
            ) : null}
          </div>
        </div>
      </header>

      {post.coverImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.coverImage}
          alt={post.title}
          className="mt-8 h-64 w-full rounded-2xl border border-white/10 object-cover sm:h-96"
        />
      ) : null}

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div>
          <Prose content={post.content} />

          {post.updatedAt !== post.createdAt ? (
            <p className="mt-10 text-xs text-slate-500">Last edited {formatDate(post.updatedAt)}</p>
          ) : null}

          <CommentsSection slug={post.slug} initialComments={comments} currentUser={viewer} />
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <Avatar name={post.author.name} color={post.author.avatarColor} image={post.author.avatarImage} verified={post.author.verified} size="md" />
              <div>
                <p className="font-semibold text-white">{post.author.name}</p>
                <p className="text-xs text-slate-400">
                  {post.author.postCount} posts · {post.author.commentCount} comments
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">{post.author.bio}</p>
            <Link href={`/authors/${post.author.handle}`} className="btn-ghost btn-sm mt-4 w-full">
              View profile
            </Link>
          </div>

          <div className="card p-5 text-sm text-slate-400">
            <p className="font-semibold text-slate-200">Discussion</p>
            <p className="mt-2 text-xs leading-relaxed">
              {post.commentCount} {post.commentCount === 1 ? "comment" : "comments"} · {post.likeCount} likes
            </p>
            <p className="mt-3 text-xs leading-relaxed">
              Threads are one level deep on purpose. Reply to the post author, not to the pile-on.
            </p>
          </div>

          {related.length ? (
            <div className="space-y-4">
              <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Related reading</p>
              {related.slice(0, 2).map((item) => (
                <PostCard key={item.id} post={item} />
              ))}
            </div>
          ) : null}
        </aside>
      </div>
    </article>
  );
}
