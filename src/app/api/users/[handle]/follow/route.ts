import { authedUser, handleApiError, ok } from "@/lib/api";
import { followUser, unfollowUser } from "@/lib/store";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ handle: string }> };

export async function POST(_request: Request, { params }: Context) {
  const auth = await authedUser();
  if ("response" in auth) return auth.response;
  try {
    const { handle } = await params;
    return ok({ author: await followUser(auth.user.id, handle) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const auth = await authedUser();
  if ("response" in auth) return auth.response;
  try {
    const { handle } = await params;
    return ok({ author: await unfollowUser(auth.user.id, handle) });
  } catch (error) {
    return handleApiError(error);
  }
}
