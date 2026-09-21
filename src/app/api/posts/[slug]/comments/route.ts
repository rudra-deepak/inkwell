import { getCurrentUser } from "@/lib/auth";
import { authedUser, handleApiError, ok, readJsonBody, requireField } from "@/lib/api";
import { createComment, listComments } from "@/lib/store";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  try {
    const { slug } = await params;
    const viewer = await getCurrentUser();
    const comments = await listComments(slug, viewer?.id ?? null);
    return ok({ comments, count: comments.length });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, { params }: Ctx) {
  try {
    const auth = await authedUser();
    if ("response" in auth) return auth.response;
    const { slug } = await params;
    const body = await readJsonBody<{ body?: unknown; parentId?: unknown }>(request);
    const text = requireField(body.body, "body", 2, 4000);
    const parentId = typeof body.parentId === "string" && body.parentId ? body.parentId : null;

    const comment = await createComment({
      postIdOrSlug: slug,
      authorId: auth.user.id,
      body: text,
      parentId,
    });
    return ok({ comment }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
