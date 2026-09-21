"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { CommentView, PublicUser } from "@/lib/store";
import { Avatar, timeAgo } from "./avatar";

type Props = {
  slug: string;
  initialComments: CommentView[];
  currentUser: PublicUser | null;
  signedIn?: boolean;
};

export function CommentsSection({ slug, initialComments, currentUser }: Props) {
  const router = useRouter();
  const [comments, setComments] = useState<CommentView[]>(initialComments);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const roots = useMemo(
    () => comments.filter((c) => !c.parentId).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [comments],
  );
  const repliesFor = (id: string) =>
    comments.filter((c) => c.parentId === id).sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));

  async function call(url: string, init: RequestInit) {
    setError(null);
    setBusy(true);
    const response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    setBusy(false);
    if (!response.ok) {
      setError((data.error as string) ?? "Something went wrong. Please try again.");
      return null;
    }
    return data;
  }

  async function submitRoot(event: React.FormEvent) {
    event.preventDefault();
    if (body.trim().length < 2) return;
    const data = await call(`/api/posts/${encodeURIComponent(slug)}/comments`, {
      method: "POST",
      body: JSON.stringify({ body }),
    });
    if (!data) return;
    setComments((current) => [...current, data.comment as CommentView]);
    setBody("");
    router.refresh();
  }

  async function submitReply(event: React.FormEvent, parentId: string) {
    event.preventDefault();
    if (replyBody.trim().length < 2) return;
    const data = await call(`/api/posts/${encodeURIComponent(slug)}/comments`, {
      method: "POST",
      body: JSON.stringify({ body: replyBody, parentId }),
    });
    if (!data) return;
    setComments((current) => [...current, data.comment as CommentView]);
    setReplyBody("");
    setReplyTo(null);
    router.refresh();
  }

  async function saveEdit(commentId: string) {
    const data = await call(`/api/comments/${commentId}`, {
      method: "PATCH",
      body: JSON.stringify({ body: editBody }),
    });
    if (!data) return;
    setComments((current) =>
      current.map((c) => (c.id === commentId ? (data.comment as CommentView) : c)),
    );
    setEditingId(null);
    setEditBody("");
  }

  async function remove(commentId: string) {
    if (!window.confirm("Delete this comment?")) return;
    const data = await call(`/api/comments/${commentId}`, { method: "DELETE" });
    if (!data) return;
    setComments((current) => current.filter((c) => c.id !== commentId && c.parentId !== commentId));
    router.refresh();
  }

  function CommentBody({ comment }: { comment: CommentView }) {
    if (editingId === comment.id) {
      return (
        <div className="mt-3 space-y-2">
          <textarea
            className="field min-h-24 resize-y"
            value={editBody}
            onChange={(event) => setEditBody(event.target.value)}
          />
          <div className="flex gap-2">
            <button type="button" className="btn-primary btn-sm" disabled={busy} onClick={() => saveEdit(comment.id)}>
              Save changes
            </button>
            <button type="button" className="btn-ghost btn-sm" onClick={() => setEditingId(null)}>
              Cancel
            </button>
          </div>
        </div>
      );
    }
    return <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-slate-300">{comment.body}</p>;
  }

  function CommentActions({ comment }: { comment: CommentView }) {
    if (!comment.isAuthor) return null;
    return (
      <div className="mt-2 flex items-center gap-3 text-xs">
        <button
          type="button"
          className="text-slate-400 transition hover:text-white"
          onClick={() => {
            setEditingId(comment.id);
            setEditBody(comment.body);
          }}
        >
          Edit
        </button>
        <button
          type="button"
          className="text-slate-400 transition hover:text-rose-300"
          onClick={() => remove(comment.id)}
        >
          Delete
        </button>
      </div>
    );
  }

  return (
    <section id="comments" className="mt-14 scroll-mt-24">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-serif text-2xl font-semibold text-white">
          Comments <span className="ml-1 text-base font-normal text-slate-400">({comments.length})</span>
        </h2>
        <Link href="#comment-form" className="btn-ghost btn-sm">
          Add a comment
        </Link>
      </div>

      {currentUser ? (
        <form id="comment-form" onSubmit={submitRoot} className="card mb-8 p-4 sm:p-5">
          <div className="flex gap-3">
            <Avatar name={currentUser.name} color={currentUser.avatarColor} image={currentUser.avatarImage} verified={currentUser.verified} size="sm" />
            <div className="flex-1">
              <textarea
                className="field min-h-28 resize-y"
                placeholder="Share what you think — insights, counterpoints, or a follow-up question…"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                maxLength={4000}
              />
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {body.length}/4000 · replying as {currentUser.name}
                </span>
                <button type="submit" className="btn-primary" disabled={busy || body.trim().length < 2}>
                  {busy ? "Posting…" : "Post comment"}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="card mb-8 flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-300">
            Join the conversation — comments are open to registered readers.
          </p>
          <div className="flex gap-2">
            <Link href={`/login?next=/posts/${slug}`} className="btn-ghost btn-sm">
              Sign in
            </Link>
            <Link href="/register" className="btn-primary btn-sm">
              Create an account
            </Link>
          </div>
        </div>
      )}

      {error ? (
        <p className="mb-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p>
      ) : null}

      {roots.length === 0 ? (
        <p className="card p-6 text-center text-sm text-slate-400">
          No comments yet. Be the first to write one.
        </p>
      ) : (
        <ul className="space-y-4">
          {roots.map((comment) => {
            const replies = repliesFor(comment.id);
            return (
              <li key={comment.id} className="card p-4 sm:p-5">
                <div className="flex gap-3">
                  <Avatar
                    name={comment.author.name}
                    color={comment.author.avatarColor}
                    image={comment.author.avatarImage}
                    verified={comment.author.verified}
                    size="sm"
                    href={`/authors/${comment.author.handle}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 text-xs">
                      <Link href={`/authors/${comment.author.handle}`} className="font-semibold text-slate-100 hover:text-white">
                        {comment.author.name}
                      </Link>
                      <span className="text-slate-500">
                        {timeAgo(comment.createdAt)}
                        {comment.edited ? " · edited" : ""}
                      </span>
                    </div>
                    <CommentBody comment={comment} />
                    <div className="flex items-center gap-3">
                      <CommentActions comment={comment} />
                      {currentUser ? (
                        <button
                          type="button"
                          className="mt-2 text-xs text-violet-300 transition hover:text-violet-200"
                          onClick={() => {
                            setReplyTo(replyTo === comment.id ? null : comment.id);
                            setReplyBody("");
                          }}
                        >
                          Reply
                        </button>
                      ) : null}
                    </div>

                    {replyTo === comment.id ? (
                      <form onSubmit={(event) => submitReply(event, comment.id)} className="mt-3 space-y-2">
                        <textarea
                          className="field min-h-20 resize-y"
                          placeholder={`Replying to ${comment.author.name}…`}
                          value={replyBody}
                          onChange={(event) => setReplyBody(event.target.value)}
                        />
                        <div className="flex gap-2">
                          <button type="submit" className="btn-primary btn-sm" disabled={busy}>
                            Post reply
                          </button>
                          <button type="button" className="btn-ghost btn-sm" onClick={() => setReplyTo(null)}>
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : null}

                    {replies.length ? (
                      <ul className="mt-4 space-y-3 border-l border-white/10 pl-4">
                        {replies.map((reply) => (
                          <li key={reply.id}>
                            <div className="flex gap-3">
                              <Avatar
                                name={reply.author.name}
                                color={reply.author.avatarColor}
                                image={reply.author.avatarImage}
                                verified={reply.author.verified}
                                size="sm"
                                href={`/authors/${reply.author.handle}`}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-x-2 text-xs">
                                  <Link
                                    href={`/authors/${reply.author.handle}`}
                                    className="font-semibold text-slate-100 hover:text-white"
                                  >
                                    {reply.author.name}
                                  </Link>
                                  <span className="text-slate-500">
                                    {timeAgo(reply.createdAt)}
                                    {reply.edited ? " · edited" : ""}
                                  </span>
                                </div>
                                <CommentBody comment={reply} />
                                <CommentActions comment={reply} />
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
