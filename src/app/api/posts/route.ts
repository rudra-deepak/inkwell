import { getCurrentUser } from "@/lib/auth";
import { authedUser, fail, handleApiError, ok, readJsonBody, requireField } from "@/lib/api";
import { createPost, listPosts, type PostInput } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const viewer = await getCurrentUser();
    const mine = url.searchParams.get("mine") === "true";

    const posts = await listPosts({
      q: url.searchParams.get("q") ?? undefined,
      tag: url.searchParams.get("tag") ?? undefined,
      authorHandle: url.searchParams.get("author") ?? undefined,
      viewerId: viewer?.id ?? null,
      includeDrafts: mine,
      sort: (url.searchParams.get("sort") as "recent" | "popular" | "discussed" | null) ?? "recent",
      limit: url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : undefined,
    });

    return ok({ posts, count: posts.length });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authedUser();
    if ("response" in auth) return auth.response;
    const body = await readJsonBody<Record<string, unknown>>(request);

    const title = requireField(body.title, "title", 4, 140);
    const content = requireField(body.content, "content", 20, 40000);
    const tags = Array.isArray(body.tags)
      ? (body.tags as unknown[]).map((t) => String(t))
      : typeof body.tags === "string"
        ? (body.tags as string).split(",")
        : [];

    const status = body.status === "draft" ? "draft" : "published";
    const payload: PostInput = {
      title,
      content,
      excerpt: typeof body.excerpt === "string" ? body.excerpt : undefined,
      tags,
      coverImage: typeof body.coverImage === "string" && body.coverImage ? body.coverImage : null,
      status,
    };

    if (!title.trim()) return fail("A title is required.", 422);
    const post = await createPost(auth.user.id, payload);
    return ok({ post }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
