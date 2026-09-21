"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { PostDetail } from "@/lib/store";
import { Prose } from "./prose";

const COVER_PRESETS = [
  { label: "None", value: "" },
  {
    label: "Code at night",
    value:
      "https://images.pexels.com/photos/34803969/pexels-photo-34803969.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  },
  {
    label: "Dual monitors",
    value:
      "https://images.pexels.com/photos/4218883/pexels-photo-4218883.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  },
  {
    label: "Notebook flat lay",
    value:
      "https://images.pexels.com/photos/7889065/pexels-photo-7889065.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  },
  {
    label: "Coffee & notes",
    value:
      "https://images.pexels.com/photos/7657611/pexels-photo-7657611.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  },
  {
    label: "Minimal desk",
    value:
      "https://images.pexels.com/photos/5554754/pexels-photo-5554754.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  },
];

const STARTER = `Open with the problem your reader has.

## A heading that earns its place

- One idea per list item
- Concrete details beat adjectives
- Use \`inline code\` when you mean code

> Quote something worth quoting.`;

export function PostEditor({ mode, post }: { mode: "create" | "edit"; post?: PostDetail }) {
  const router = useRouter();
  const [title, setTitle] = useState(post?.title ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [tags, setTags] = useState((post?.tags ?? []).join(", "));
  const [coverImage, setCoverImage] = useState(post?.coverImage ?? "");
  const [content, setContent] = useState(post?.content ?? (mode === "create" ? STARTER : ""));
  const [status, setStatus] = useState<"published" | "draft">(post?.status ?? "published");
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const stats = useMemo(() => {
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    return { words, minutes: Math.max(1, Math.round(words / 220)) };
  }, [content]);

  async function save(nextStatus: "published" | "draft") {
    setBusy(true);
    setError(null);
    const payload = {
      title: title.trim(),
      excerpt: excerpt.trim(),
      content,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      coverImage: coverImage || null,
      status: nextStatus,
    };

    const url = mode === "create" ? "/api/posts" : `/api/posts/${encodeURIComponent(post!.slug)}`;
    const response = await fetch(url, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json().catch(() => ({}))) as { post?: PostDetail; error?: string };
    setBusy(false);

    if (!response.ok || !data.post) {
      setError(data.error ?? "Could not save the post.");
      return;
    }
    setStatus(nextStatus);
    router.push(`/posts/${data.post.slug}`);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wider text-violet-300 uppercase">
            {mode === "create" ? "New post" : "Editing"}
          </p>
          <h1 className="font-serif text-3xl font-semibold text-white">
            {mode === "create" ? "Write something worth commenting on" : post?.title}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn-ghost btn-sm" onClick={() => setPreview((value) => !value)}>
            {preview ? "Back to editor" : "Preview"}
          </button>
          <button type="button" className="btn-ghost btn-sm" disabled={busy} onClick={() => save("draft")}>
            Save draft
          </button>
          <button type="button" className="btn-primary btn-sm" disabled={busy} onClick={() => save("published")}>
            {busy ? "Saving…" : status === "draft" ? "Publish" : mode === "create" ? "Publish post" : "Save changes"}
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <div className="card space-y-4 p-5">
          <div>
            <label className="label" htmlFor="title">
              Title
            </label>
            <input
              id="title"
              className="field text-lg"
              placeholder="A clear, specific headline"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={140}
            />
          </div>

          <div>
            <label className="label" htmlFor="excerpt">
              Summary <span className="font-normal normal-case">(optional — auto-generated if blank)</span>
            </label>
            <input
              id="excerpt"
              className="field"
              placeholder="One sentence that makes someone want to read on"
              value={excerpt}
              onChange={(event) => setExcerpt(event.target.value)}
              maxLength={220}
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="label" htmlFor="content">
                Body · markdown-lite
              </label>
              <span className="mb-1.5 text-xs text-slate-500">
                {stats.words} words · {stats.minutes} min read
              </span>
            </div>
            {preview ? (
              <div className="rounded-xl border border-white/10 bg-black/20 p-5">
                <Prose content={content || "_Nothing to preview yet._"} />
              </div>
            ) : (
              <textarea
                id="content"
                className="field min-h-[26rem] resize-y font-mono text-[13px] leading-relaxed"
                placeholder="## Start writing…"
                value={content}
                onChange={(event) => setContent(event.target.value)}
              />
            )}
          </div>

          <p className="text-xs text-slate-500">
            Formatting: <code className="text-fuchsia-200">## heading</code>,{" "}
            <code className="text-fuchsia-200">- list</code>, <code className="text-fuchsia-200">&gt; quote</code>,{" "}
            <code className="text-fuchsia-200">**bold**</code>, <code className="text-fuchsia-200">`code`</code>.
          </p>
        </div>

        <aside className="space-y-5">
          <div className="card space-y-4 p-5">
            <div>
              <label className="label" htmlFor="tags">
                Topics
              </label>
              <input
                id="tags"
                className="field"
                placeholder="design, api, local-first"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
              />
              <p className="mt-1.5 text-xs text-slate-500">Comma separated, up to 6 topics.</p>
            </div>

            <div>
              <label className="label" htmlFor="cover">
                Cover image
              </label>
              <select
                id="cover"
                className="field cursor-pointer"
                value={COVER_PRESETS.some((preset) => preset.value === coverImage) ? coverImage : "__custom"}
                onChange={(event) => setCoverImage(event.target.value === "__custom" ? "" : event.target.value)}
              >
                {COVER_PRESETS.map((preset) => (
                  <option key={preset.label} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
                <option value="__custom">Custom URL…</option>
              </select>
              <input
                className="field mt-2"
                placeholder="https://…"
                value={coverImage}
                onChange={(event) => setCoverImage(event.target.value)}
              />
            </div>

            {coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverImage} alt="Cover preview" className="h-32 w-full rounded-xl object-cover" />
            ) : (
              <div className="grid h-32 w-full place-items-center rounded-xl border border-dashed border-white/15 text-xs text-slate-500">
                Gradient placeholder will be used
              </div>
            )}
          </div>

          <div className="card space-y-3 p-5 text-sm text-slate-400">
            <p className="font-semibold text-slate-200">Posting checklist</p>
            <ul className="space-y-2 text-xs leading-relaxed">
              <li>• Does the title promise something specific?</li>
              <li>• Is there one idea a reader can argue with?</li>
              <li>• Would a comment thread make this better?</li>
            </ul>
            <Link href="/dashboard" className="btn-ghost btn-sm">
              Back to dashboard
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
