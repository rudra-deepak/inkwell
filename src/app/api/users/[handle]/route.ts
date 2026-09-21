import { handleApiError, ok } from "@/lib/api";
import { findUserByHandle, listPosts } from "@/lib/store";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ handle: string }> }) {
  try {
    const { handle } = await params;
    const author = await findUserByHandle(handle);
    if (!author) return ok({ error: "Author not found." }, 404);
    const viewer = await getCurrentUser();
    const posts = await listPosts({ authorHandle: handle, viewerId: viewer?.id ?? null });
    return ok({ author, posts });
  } catch (error) {
    return handleApiError(error);
  }
}
