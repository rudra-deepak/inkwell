import { handleApiError, ok } from "@/lib/api";
import { listUserConnections, StoreError } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ handle: string }> }) {
  try {
    const kind = new URL(request.url).searchParams.get("kind");
    if (kind !== "followers" && kind !== "following") throw new StoreError('"kind" must be followers or following.', 422);
    const { handle } = await params;
    return ok({ people: await listUserConnections(handle, kind) });
  } catch (error) {
    return handleApiError(error);
  }
}
