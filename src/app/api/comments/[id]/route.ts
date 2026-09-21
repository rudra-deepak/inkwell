import { authedUser, handleApiError, ok, readJsonBody, requireField } from "@/lib/api";
import { deleteComment, updateComment } from "@/lib/store";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const auth = await authedUser();
    if ("response" in auth) return auth.response;
    const { id } = await params;
    const body = await readJsonBody<{ body?: unknown }>(request);
    const text = requireField(body.body, "body", 2, 4000);
    const comment = await updateComment(id, auth.user.id, text);
    return ok({ comment });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const auth = await authedUser();
    if ("response" in auth) return auth.response;
    const { id } = await params;
    const deleted = await deleteComment(id, auth.user.id);
    return ok({ deleted });
  } catch (error) {
    return handleApiError(error);
  }
}
