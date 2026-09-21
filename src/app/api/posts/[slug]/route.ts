import { getCurrentUser } from "@/lib/auth";
import { authedUser, handleApiError, ok, readJsonBody } from "@/lib/api";
import { deletePost, getPostBySlug, updatePost, type PostInput } from "@/lib/store";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  try {
    const { slug } = await params;
    const viewer = await getCurrentUser();
    const post = await getPostBySlug(slug, viewer?.id ?? null);
    if (!post) return ok({ error: "Post not found." }, 404);
    return ok({ post });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const auth = await authedUser();
    if ("response" in auth) return auth.response;
    const { slug } = await params;
    const body = await readJsonBody<Record<string, unknown>>(request);

    const payload: Partial<PostInput> = {};
    if (typeof body.title === "string") payload.title = body.title;
    if (typeof body.content === "string") payload.content = body.content;
    if (typeof body.excerpt === "string") payload.excerpt = body.excerpt;
    if (Array.isArray(body.tags)) payload.tags = (body.tags as unknown[]).map(String);
    else if (typeof body.tags === "string") payload.tags = body.tags.split(",");
    if (body.coverImage === null || typeof body.coverImage === "string") {
      payload.coverImage = (body.coverImage as string | null) ?? null;
    }
    if (body.status === "draft" || body.status === "published") payload.status = body.status;

    const post = await updatePost(slug, auth.user.id, payload);
    return ok({ post });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const auth = await authedUser();
    if ("response" in auth) return auth.response;
    const { slug } = await params;
    const result = await deletePost(slug, auth.user.id);
    return ok({ deleted: result });
  } catch (error) {
    return handleApiError(error);
  }
}
