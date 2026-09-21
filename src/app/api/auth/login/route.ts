import { attachSessionCookie } from "@/lib/auth";
import { fail, handleApiError, ok, readJsonBody, requireField } from "@/lib/api";
import { authenticateUser, createSession, toPublicUser } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<{ email?: unknown; password?: unknown }>(request);
    const email = requireField(body.email, "email", 5, 160);
    const password = requireField(body.password, "password", 1, 200);

    const user = await authenticateUser(email, password);
    if (!user) return fail("Email or password is incorrect.", 401);

    const session = await createSession(user._id);
    return attachSessionCookie(ok({ user: await toPublicUser(user) }), session.token);
  } catch (error) {
    return handleApiError(error);
  }
}
