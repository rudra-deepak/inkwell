import { attachSessionCookie } from "@/lib/auth";
import { fail, handleApiError, ok, readJsonBody, requireField } from "@/lib/api";
import { createSession, createUser, normalizeEmail, toPublicUser } from "@/lib/store";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<{ name?: unknown; email?: unknown; password?: unknown }>(request);
    const name = requireField(body.name, "name", 2, 60);
    const email = normalizeEmail(requireField(body.email, "email", 5, 160));
    const password = requireField(body.password, "password", 6, 200);

    if (!EMAIL_RE.test(email)) return fail("Please enter a valid email address.", 422);
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return fail("Password needs at least one letter and one number.", 422);
    }

    const user = await createUser({ name, email, password });
    const session = await createSession(user._id);

    return attachSessionCookie(ok({ user: await toPublicUser(user) }, 201), session.token);
  } catch (error) {
    return handleApiError(error);
  }
}
