import { NextResponse } from "next/server";
import { StoreError, type PublicUser } from "./store";
import { getCurrentUser } from "./auth";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof StoreError) return fail(error.message, error.status);
  console.error("[api]", error);
  return fail("Unexpected server error.", 500);
}

export async function readJsonBody<T = Record<string, unknown>>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new StoreError("Request body must be valid JSON.", 400);
  }
}

export function requireField(value: unknown, field: string, min = 1, max = 20000) {
  if (typeof value !== "string" || value.trim().length < min) {
    throw new StoreError(`"${field}" is required.`, 422);
  }
  if (value.length > max) throw new StoreError(`"${field}" is too long.`, 422);
  return value.trim();
}

export function optionalString(value: unknown, max = 400): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") throw new StoreError("Expected a string value.", 422);
  if (value.length > max) throw new StoreError("Value is too long.", 422);
  return value;
}

const AVATAR_DATA_URI = /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/]+=*$/;
// ~2M base64 chars ≈ 1.5MB decoded — comfortably above what the client-side
// resize step produces, but still small enough to keep documents lean and
// block someone from posting a raw multi-megabyte image straight to the API.
const MAX_AVATAR_DATA_URI_LENGTH = 2_000_000;

/** `undefined` = field omitted (no change). `null` = explicit clear. string = new image. */
export function optionalAvatarImage(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string" || !AVATAR_DATA_URI.test(value)) {
    throw new StoreError("Profile photo must be a PNG, JPEG, WEBP, or GIF image.", 422);
  }
  if (value.length > MAX_AVATAR_DATA_URI_LENGTH) {
    throw new StoreError("That photo is too large — try a smaller image.", 422);
  }
  return value;
}

/** Use in mutating route handlers: returns the session user or a 401 response. */
export async function authedUser(): Promise<{ user: PublicUser } | { response: NextResponse }> {
  const user = await getCurrentUser();
  if (!user) return { response: fail("You must be signed in.", 401) };
  return { user };
}
