import { authedUser, handleApiError, ok } from "@/lib/api";
import { toggleLike } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const auth = await authedUser();
    if ("response" in auth) return auth.response;
    const { slug } = await params;
    const result = await toggleLike(slug, auth.user.id);
    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}
