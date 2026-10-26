// import { handleApiError, ok } from "@/lib/api";
// import { findUserByHandle, listPosts } from "@/lib/store";
// import { getCurrentUser } from "@/lib/auth";

// export const dynamic = "force-dynamic";

// export async function GET(_request: Request, { params }: { params: Promise<{ handle: string }> }) {
//   try {
//     const { handle } = await params;
//     const viewer = await getCurrentUser();
//     const author = await findUserByHandle(handle, viewer?.id ?? null);
//     if (!author) return ok({ error: "Author not found." }, 404);
//     const posts = await listPosts({ authorHandle: handle, viewerId: viewer?.id ?? null });
//     return ok({ author, posts });
//   } catch (error) {
//     return handleApiError(error);
//   }
// }

import { handleApiError, ok } from "@/lib/api";
import { listUserConnections, StoreError } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const kind = new URL(request.url).searchParams.get("kind");

    if (kind !== "followers" && kind !== "following") {
      throw new StoreError(
        '"kind" must be followers or following.',
        422
      );
    }

    const { handle } = await params;

    return ok({
      people: await listUserConnections(handle, kind),
    });
  } catch (error) {
    return handleApiError(error);
  }
}