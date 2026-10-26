// "use client";

// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { useMemo, useState } from "react";
// import type { PostDetail } from "@/lib/store";
// import { Prose } from "./prose";

// const COVER_PRESETS = [
//   { label: "None", value: "" },
//   {
//     label: "Code at night",
//     value:
//       "https://images.pexels.com/photos/34803969/pexels-photo-34803969.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
//   },
//   {
//     label: "Dual monitors",
//     value:
//       "https://images.pexels.com/photos/4218883/pexels-photo-4218883.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
//   },
//   {
//     label: "Notebook flat lay",
//     value:
//       "https://images.pexels.com/photos/7889065/pexels-photo-7889065.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
//   },
//   {
//     label: "Coffee & notes",
//     value:
//       "https://images.pexels.com/photos/7657611/pexels-photo-7657611.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
//   },
//   {
//     label: "Minimal desk",
//     value:
//       "https://images.pexels.com/photos/5554754/pexels-photo-5554754.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
//   },
// ];

// const STARTER = `Open with the problem your reader has.

// ## A heading that earns its place

// - One idea per list item
// - Concrete details beat adjectives
// - Use \`inline code\` when you mean code

// > Quote something worth quoting.`;

// export function PostEditor({ mode, post }: { mode: "create" | "edit"; post?: PostDetail }) {
//   const router = useRouter();
//   const [title, setTitle] = useState(post?.title ?? "");
//   const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
//   const [tags, setTags] = useState((post?.tags ?? []).join(", "));
//   const [coverImage, setCoverImage] = useState(post?.coverImage ?? "");
//   const [content, setContent] = useState(post?.content ?? (mode === "create" ? STARTER : ""));
//   const [status, setStatus] = useState<"published" | "draft">(post?.status ?? "published");
//   const [preview, setPreview] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [busy, setBusy] = useState(false);

//   const stats = useMemo(() => {
//     const words = content.trim().split(/\s+/).filter(Boolean).length;
//     return { words, minutes: Math.max(1, Math.round(words / 220)) };
//   }, [content]);

//   async function save(nextStatus: "published" | "draft") {
//     setBusy(true);
//     setError(null);
//     const payload = {
//       title: title.trim(),
//       excerpt: excerpt.trim(),
//       content,
//       tags: tags
//         .split(",")
//         .map((tag) => tag.trim())
//         .filter(Boolean),
//       coverImage: coverImage || null,
//       status: nextStatus,
//     };

//     const url = mode === "create" ? "/api/posts" : `/api/posts/${encodeURIComponent(post!.slug)}`;
//     const response = await fetch(url, {
//       method: mode === "create" ? "POST" : "PATCH",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(payload),
//     });
//     const data = (await response.json().catch(() => ({}))) as { post?: PostDetail; error?: string };
//     setBusy(false);

//     if (!response.ok || !data.post) {
//       setError(data.error ?? "Could not save the post.");
//       return;
//     }
//     setStatus(nextStatus);
//     router.push(`/posts/${data.post.slug}`);
//     router.refresh();
//   }

//   return (
//     <div className="space-y-5">
//       <div className="flex flex-wrap items-end justify-between gap-3">
//         <div>
//           <p className="text-xs font-semibold tracking-wider text-violet-300 uppercase">
//             {mode === "create" ? "New post" : "Editing"}
//           </p>
//           <h1 className="font-serif text-3xl font-semibold text-white">
//             {mode === "create" ? "Write something worth commenting on" : post?.title}
//           </h1>
//         </div>
//         <div className="flex items-center gap-2">
//           <button type="button" className="btn-ghost btn-sm" onClick={() => setPreview((value) => !value)}>
//             {preview ? "Back to editor" : "Preview"}
//           </button>
//           <button type="button" className="btn-ghost btn-sm" disabled={busy} onClick={() => save("draft")}>
//             Save draft
//           </button>
//           <button type="button" className="btn-primary btn-sm" disabled={busy} onClick={() => save("published")}>
//             {busy ? "Saving…" : status === "draft" ? "Publish" : mode === "create" ? "Publish post" : "Save changes"}
//           </button>
//         </div>
//       </div>

//       {error ? (
//         <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p>
//       ) : null}

//       <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
//         <div className="card space-y-4 p-5">
//           <div>
//             <label className="label" htmlFor="title">
//               Title
//             </label>
//             <input
//               id="title"
//               className="field text-lg"
//               placeholder="A clear, specific headline"
//               value={title}
//               onChange={(event) => setTitle(event.target.value)}
//               maxLength={140}
//             />
//           </div>

//           <div>
//             <label className="label" htmlFor="excerpt">
//               Summary <span className="font-normal normal-case">(optional — auto-generated if blank)</span>
//             </label>
//             <input
//               id="excerpt"
//               className="field"
//               placeholder="One sentence that makes someone want to read on"
//               value={excerpt}
//               onChange={(event) => setExcerpt(event.target.value)}
//               maxLength={220}
//             />
//           </div>

//           <div>
//             <div className="flex items-center justify-between">
//               <label className="label" htmlFor="content">
//                 Body · markdown-lite
//               </label>
//               <span className="mb-1.5 text-xs text-slate-500">
//                 {stats.words} words · {stats.minutes} min read
//               </span>
//             </div>
//             {preview ? (
//               <div className="rounded-xl border border-white/10 bg-black/20 p-5">
//                 <Prose content={content || "_Nothing to preview yet._"} />
//               </div>
//             ) : (
//               <textarea
//                 id="content"
//                 className="field min-h-[26rem] resize-y font-mono text-[13px] leading-relaxed"
//                 placeholder="## Start writing…"
//                 value={content}
//                 onChange={(event) => setContent(event.target.value)}
//               />
//             )}
//           </div>

//           <p className="text-xs text-slate-500">
//             Formatting: <code className="text-fuchsia-200">## heading</code>,{" "}
//             <code className="text-fuchsia-200">- list</code>, <code className="text-fuchsia-200">&gt; quote</code>,{" "}
//             <code className="text-fuchsia-200">**bold**</code>, <code className="text-fuchsia-200">`code`</code>.
//           </p>
//         </div>

//         <aside className="space-y-5">
//           <div className="card space-y-4 p-5">
//             <div>
//               <label className="label" htmlFor="tags">
//                 Topics
//               </label>
//               <input
//                 id="tags"
//                 className="field"
//                 placeholder="design, api, local-first"
//                 value={tags}
//                 onChange={(event) => setTags(event.target.value)}
//               />
//               <p className="mt-1.5 text-xs text-slate-500">Comma separated, up to 6 topics.</p>
//             </div>

//             <div>
//               <label className="label" htmlFor="cover">
//                 Cover image
//               </label>
//               <select
//                 id="cover"
//                 className="field cursor-pointer"
//                 value={COVER_PRESETS.some((preset) => preset.value === coverImage) ? coverImage : "__custom"}
//                 onChange={(event) => setCoverImage(event.target.value === "__custom" ? "" : event.target.value)}
//               >
//                 {COVER_PRESETS.map((preset) => (
//                   <option key={preset.label} value={preset.value}>
//                     {preset.label}
//                   </option>
//                 ))}
//                 <option value="__custom">Custom URL…</option>
//               </select>
//               <input
//                 className="field mt-2"
//                 placeholder="https://…"
//                 value={coverImage}
//                 onChange={(event) => setCoverImage(event.target.value)}
//               />
//             </div>

//             {coverImage ? (
//               // eslint-disable-next-line @next/next/no-img-element
//               <img src={coverImage} alt="Cover preview" className="h-32 w-full rounded-xl object-cover" />
//             ) : (
//               <div className="grid h-32 w-full place-items-center rounded-xl border border-dashed border-white/15 text-xs text-slate-500">
//                 Gradient placeholder will be used
//               </div>
//             )}
//           </div>

//           <div className="card space-y-3 p-5 text-sm text-slate-400">
//             <p className="font-semibold text-slate-200">Posting checklist</p>
//             <ul className="space-y-2 text-xs leading-relaxed">
//               <li>• Does the title promise something specific?</li>
//               <li>• Is there one idea a reader can argue with?</li>
//               <li>• Would a comment thread make this better?</li>
//             </ul>
//             <Link href="/dashboard" className="btn-ghost btn-sm">
//               Back to dashboard
//             </Link>
//           </div>
//         </aside>
//       </div>
//     </div>
//   );
// }




"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

import type { PostDetail } from "@/lib/store";
import { Prose } from "./prose";

/* =========================================================
   COVER PRESETS
========================================================= */

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

/* =========================================================
   STARTER CONTENT
========================================================= */

const STARTER = `Open with the problem your reader has.

## A heading that earns its place

- One idea per list item
- Concrete details beat adjectives
- Use \`inline code\` when you mean code

> Quote something worth quoting.`;

/* =========================================================
   IMAGE COMPRESSION
========================================================= */

function compressImage(
  file: File,
  maxWidth = 1600,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        let width = image.width;
        let height = image.height;

        /* Resize large images */

        if (width > maxWidth) {
          const ratio = maxWidth / width;

          width = maxWidth;
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");

        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");

        if (!context) {
          reject(new Error("Could not process the image."));
          return;
        }

        context.drawImage(image, 0, 0, width, height);

        /*
          JPEG keeps the database payload much smaller
          than the original camera/gallery image.
        */

        const compressed = canvas.toDataURL("image/jpeg", quality);

        resolve(compressed);
      };

      image.onerror = () => {
        reject(new Error("Could not read the selected image."));
      };

      image.src = reader.result as string;
    };

    reader.onerror = () => {
      reject(new Error("Could not read the selected file."));
    };

    reader.readAsDataURL(file);
  });
}

/* =========================================================
   COMPONENT
========================================================= */

export function PostEditor({
  mode,
  post,
}: {
  mode: "create" | "edit";
  post?: PostDetail;
}) {
  const router = useRouter();

  /* =======================================================
     STATE
  ======================================================= */

  const [title, setTitle] = useState(post?.title ?? "");

  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");

  const [tags, setTags] = useState((post?.tags ?? []).join(", "));

  const [coverImage, setCoverImage] = useState(post?.coverImage ?? "");

  const [content, setContent] = useState(
    post?.content ?? (mode === "create" ? STARTER : "")
  );

  const [status, setStatus] = useState<"published" | "draft">(
    post?.status ?? "published"
  );

  const [preview, setPreview] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);

  const [coverOpen, setCoverOpen] = useState(false);

  const [uploadingImage, setUploadingImage] = useState(false);

  const [customUrlMode, setCustomUrlMode] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* =======================================================
     WORD STATS
  ======================================================= */

  const stats = useMemo(() => {
    const words = content.trim().split(/\s+/).filter(Boolean).length;

    return {
      words,
      minutes: Math.max(1, Math.round(words / 220)),
    };
  }, [content]);

  /* =======================================================
     CURRENT COVER LABEL
  ======================================================= */

  const currentCoverLabel = useMemo(() => {
    const preset = COVER_PRESETS.find(
      (preset) => preset.value === coverImage
    );

    if (preset) {
      return preset.label;
    }

    if (coverImage.startsWith("data:image/")) {
      return "Uploaded image";
    }

    if (coverImage) {
      return "Custom URL";
    }

    return "None";
  }, [coverImage]);

  /* =======================================================
     SAVE POST
  ======================================================= */

  async function save(nextStatus: "published" | "draft") {
    setBusy(true);
    setError(null);

    try {
      const payload = {
        title: title.trim(),

        excerpt: excerpt.trim(),

        content,

        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
          .slice(0, 6),

        coverImage: coverImage || null,

        status: nextStatus,
      };

      const url =
        mode === "create"
          ? "/api/posts"
          : `/api/posts/${encodeURIComponent(post!.slug)}`;

      const response = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => ({}))) as {
        post?: PostDetail;
        error?: string;
      };

      if (!response.ok || !data.post) {
        setError(data.error ?? "Could not save the post.");
        return;
      }

      setStatus(nextStatus);

      router.push(`/posts/${data.post.slug}`);

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while saving the post."
      );
    } finally {
      setBusy(false);
    }
  }

  /* =======================================================
     GALLERY UPLOAD
  ======================================================= */

  async function handleGalleryUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    /* Only images */

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");

      event.target.value = "";

      return;
    }

    /* 15 MB original limit */

    if (file.size > 15 * 1024 * 1024) {
      setError("Image is too large. Please choose an image under 15 MB.");

      event.target.value = "";

      return;
    }

    setUploadingImage(true);

    setError(null);

    try {
      const compressedImage = await compressImage(file);

      setCoverImage(compressedImage);

      setCustomUrlMode(false);

      setCoverOpen(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not upload the selected image."
      );
    } finally {
      setUploadingImage(false);

      /*
        Reset input so the user can select
        the same image again if needed.
      */

      event.target.value = "";
    }
  }

  /* =======================================================
     REMOVE COVER
  ======================================================= */

  function removeCover() {
    setCoverImage("");

    setCustomUrlMode(false);

    setCoverOpen(false);
  }

  /* =======================================================
     SELECT PRESET
  ======================================================= */

  function selectPreset(value: string) {
    setCoverImage(value);

    setCustomUrlMode(false);

    setCoverOpen(false);
  }

  /* =======================================================
     OPEN GALLERY
  ======================================================= */

  function openGallery() {
    fileInputRef.current?.click();
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="space-y-5">
      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-300">
            {mode === "create" ? "New post" : "Editing"}
          </p>

          <h1 className="font-serif text-3xl font-semibold text-white">
            {mode === "create"
              ? "Write something worth commenting on"
              : post?.title}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={() => setPreview((value) => !value)}
          >
            {preview ? "Back to editor" : "Preview"}
          </button>

          <button
            type="button"
            className="btn-ghost btn-sm"
            disabled={busy}
            onClick={() => save("draft")}
          >
            Save draft
          </button>

          <button
            type="button"
            className="btn-primary btn-sm"
            disabled={busy}
            onClick={() => save("published")}
          >
            {busy
              ? "Saving…"
              : status === "draft"
              ? "Publish"
              : mode === "create"
              ? "Publish post"
              : "Save changes"}
          </button>
        </div>
      </div>

      {/* ===================================================
          ERROR
      =================================================== */}

      {error ? (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {/* ===================================================
          MAIN GRID
      =================================================== */}

      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        {/* =================================================
            EDITOR
        ================================================= */}

        <div className="card space-y-4 p-5">
          {/* TITLE */}

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

          {/* EXCERPT */}

          <div>
            <label className="label" htmlFor="excerpt">
              Summary{" "}
              <span className="font-normal normal-case">
                (optional — auto-generated if blank)
              </span>
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

          {/* BODY */}

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
                <Prose
                  content={content || "_Nothing to preview yet._"}
                />
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

          {/* FORMAT HELP */}

          <p className="text-xs text-slate-500">
            Formatting:{" "}
            <code className="text-fuchsia-200">## heading</code>,{" "}
            <code className="text-fuchsia-200">- list</code>,{" "}
            <code className="text-fuchsia-200">&gt; quote</code>,{" "}
            <code className="text-fuchsia-200">**bold**</code>,{" "}
            <code className="text-fuchsia-200">`code`</code>.
          </p>
        </div>

        {/* =================================================
            SIDEBAR
        ================================================= */}

        <aside className="space-y-5">
          {/* =================================================
              COVER CARD
          ================================================= */}

          <div className="card space-y-4 p-5">
            <div>
              <label className="label" htmlFor="cover">
                Cover image
              </label>

              {/* Hidden gallery input */}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleGalleryUpload}
              />

              {/* =================================================
                  CUSTOM DARK DROPDOWN
              ================================================= */}

              <div className="relative mt-1">
                {/* Selected value */}

                <button
                  id="cover"
                  type="button"
                  disabled={uploadingImage}
                  onClick={() => setCoverOpen((value) => !value)}
                  className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-left text-sm text-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all duration-200 hover:border-violet-400/40 hover:bg-white/[0.055] focus:outline-none focus:ring-2 focus:ring-violet-500/30 disabled:cursor-wait disabled:opacity-60"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-violet-400/15 bg-violet-500/10 text-violet-300">
                      {uploadingImage ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-300/30 border-t-violet-300" />
                      ) : coverImage ? (
                        "✦"
                      ) : (
                        "○"
                      )}
                    </span>

                    <span className="truncate">
                      {uploadingImage
                        ? "Processing image…"
                        : currentCoverLabel}
                    </span>
                  </span>

                  <svg
                    className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 ${
                      coverOpen
                        ? "rotate-180 text-violet-300"
                        : ""
                    }`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {/* =================================================
                    DROPDOWN MENU
                ================================================= */}

                {coverOpen ? (
                  <div className="relative z-10 mt-2 w-full overflow-hidden rounded-xl border border-violet-400/20 bg-[#17131d]/98 p-1.5 shadow-2xl shadow-black/60 backdrop-blur-xl">
                    {/* PRESETS */}

                    <div className="px-2 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                      Presets
                    </div>

                    {COVER_PRESETS.map((preset) => {
                      const selected = preset.value === coverImage;

                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() =>
                            selectPreset(preset.value)
                          }
                          className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all duration-150 ${
                            selected
                              ? "bg-violet-500/15 text-violet-200"
                              : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                          }`}
                        >
                          <span
                            className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border text-xs transition ${
                              selected
                                ? "border-violet-400/30 bg-violet-500/15 text-violet-300"
                                : "border-white/10 bg-white/[0.03] text-slate-500 group-hover:border-white/20 group-hover:text-slate-300"
                            }`}
                          >
                            {preset.value ? "✦" : "○"}
                          </span>

                          <span className="flex-1">
                            {preset.label}
                          </span>

                          {selected ? (
                            <svg
                              className="h-4 w-4 text-violet-300"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.704 5.29a1 1 0 010 1.42l-7.25 7.25a1 1 0 01-1.42 0l-3.25-3.25a1 1 0 011.42-1.42l2.54 2.54 6.54-6.54a1 1 0 011.42 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : null}
                        </button>
                      );
                    })}

                    {/* DIVIDER */}

                    <div className="my-1.5 border-t border-white/[0.06]" />

                    {/* GALLERY */}

                    <button
                      type="button"
                      onClick={openGallery}
                      className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-300 transition hover:bg-violet-500/10 hover:text-white"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-violet-400/20 bg-violet-500/10 text-violet-300">
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <rect
                            x="3"
                            y="3"
                            width="18"
                            height="18"
                            rx="3"
                          />

                          <circle cx="8.5" cy="8.5" r="1.5" />

                          <path d="m21 15-5-5L5 21" />
                        </svg>
                      </span>

                      <span className="flex-1">
                        <span className="block">
                          Upload from gallery
                        </span>

                        <span className="mt-0.5 block text-[11px] text-slate-500">
                          JPG, PNG, WEBP or GIF
                        </span>
                      </span>
                    </button>

                    {/* CUSTOM URL */}

                    <button
                      type="button"
                      onClick={() => {
                        setCustomUrlMode(true);
                        setCoverOpen(false);
                      }}
                      className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-slate-400">
                        ↗
                      </span>

                      <span>Use custom URL</span>
                    </button>

                    {/* REMOVE */}

                    {coverImage ? (
                      <button
                        type="button"
                        onClick={removeCover}
                        className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-rose-300 transition hover:bg-rose-500/10 hover:text-rose-200"
                      >
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-rose-400/10 bg-rose-500/5">
                          ×
                        </span>

                        <span>Remove cover image</span>
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {/* =================================================
                  CUSTOM URL INPUT
              ================================================= */}

              {(customUrlMode ||
                (coverImage &&
                  !coverImage.startsWith("data:image/") &&
                  !COVER_PRESETS.some(
                    (preset) => preset.value === coverImage
                  ))) && (
                <div className="mt-2">
                  <input
                    className="field"
                    placeholder="https://example.com/image.jpg"
                    value={coverImage}
                    onChange={(event) =>
                      setCoverImage(event.target.value)
                    }
                  />

                  <p className="mt-1.5 text-xs text-slate-500">
                    Paste a direct image URL.
                  </p>
                </div>
              )}
            </div>

            {/* =================================================
                COVER PREVIEW
            ================================================= */}

            {coverImage ? (
              <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-black/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}

                <img
                  src={coverImage}
                  alt="Cover preview"
                  className="h-40 w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                />

                {/* Overlay */}

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                {/* Image label */}

                <div className="absolute bottom-3 left-3 rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[10px] font-medium text-white backdrop-blur-md">
                  {coverImage.startsWith("data:image/")
                    ? "Uploaded image"
                    : "Cover preview"}
                </div>

                {/* Remove button */}

                <button
                  type="button"
                  onClick={removeCover}
                  className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-black/50 text-sm text-white opacity-0 backdrop-blur-md transition group-hover:opacity-100 hover:bg-rose-500/80"
                  title="Remove cover"
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={openGallery}
                className="group grid h-40 w-full place-items-center rounded-xl border border-dashed border-white/10 bg-white/[0.015] text-center transition hover:border-violet-400/30 hover:bg-violet-500/[0.03]"
              >
                <span>
                  <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-500 transition group-hover:border-violet-400/20 group-hover:bg-violet-500/10 group-hover:text-violet-300">
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    >
                      <rect
                        x="3"
                        y="3"
                        width="18"
                        height="18"
                        rx="3"
                      />

                      <circle cx="8.5" cy="8.5" r="1.5" />

                      <path d="m21 15-5-5L5 21" />
                    </svg>
                  </span>

                  <span className="mt-2 block text-xs font-medium text-slate-400 group-hover:text-slate-200">
                    Add a cover image
                  </span>

                  <span className="mt-1 block text-[11px] text-slate-600">
                    Choose from presets or upload your own
                  </span>
                </span>
              </button>
            )}
          </div>

          {/* =================================================
              POSTING CHECKLIST
          ================================================= */}

          <div className="card space-y-3 p-5 text-sm text-slate-400">
            <p className="font-semibold text-slate-200">
              Posting checklist
            </p>

            <ul className="space-y-2 text-xs leading-relaxed">
              <li>• Does the title promise something specific?</li>

              <li>
                • Is there one idea a reader can argue with?
              </li>

              <li>
                • Would a comment thread make this better?
              </li>
            </ul>

            <Link
              href="/dashboard"
              className="btn-ghost btn-sm"
            >
              Back to dashboard
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}