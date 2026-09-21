import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { SESSION_TTL_DAYS, resolveSession, type PublicUser } from "./store";

export const SESSION_COOKIE = "inkwell_session";

/** Reads the session token from the httpOnly cookie (or a Bearer header for API clients). */
export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(SESSION_COOKIE)?.value;
  if (fromCookie) return fromCookie;

  try {
    const headerList = await headers();
    const auth = headerList.get("authorization");
    if (auth?.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  } catch {
    /* headers() is unavailable in some contexts */
  }
  return null;
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  try {
    const token = await getSessionToken();
    return await resolveSession(token);
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");
  return user;
}

export function attachSessionCookie<T>(response: NextResponse<T>, token: string) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_DAYS * 86_400,
  });
  return response;
}

export function clearSessionCookie<T>(response: NextResponse<T>) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
