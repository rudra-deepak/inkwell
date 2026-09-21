import { getCurrentUser } from "@/lib/auth";
import { authedUser, handleApiError, ok, optionalAvatarImage, optionalString, readJsonBody } from "@/lib/api";
import { toPublicUser, updateUser } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    return ok({ user });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await authedUser();
    if ("response" in auth) return auth.response;
    const body = await readJsonBody<{ name?: unknown; bio?: unknown; avatarImage?: unknown }>(request);
    const name = optionalString(body.name, 60);
    const bio = optionalString(body.bio, 280);
    const avatarImage = optionalAvatarImage(body.avatarImage);

    const updated = await updateUser(auth.user.id, { name, bio, avatarImage });
    return ok({ user: await toPublicUser(updated) });
  } catch (error) {
    return handleApiError(error);
  }
}
