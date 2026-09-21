import { clearSessionCookie, getSessionToken } from "@/lib/auth";
import { handleApiError, ok } from "@/lib/api";
import { destroySession } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const token = await getSessionToken();
    await destroySession(token);
    return clearSessionCookie(ok({ ok: true }));
  } catch (error) {
    return handleApiError(error);
  }
}
