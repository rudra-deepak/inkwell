import { getStoreHealth } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * Health probe for the MongoDB-backed storage layer.
 * Confirms the database is reachable and reports basic counts.
 */
export async function GET() {
  try {
    const health = await getStoreHealth();
    return Response.json({ ok: true, storage: "mongodb", ...health });
  } catch (error) {
    console.error("[health]", error);
    return Response.json({ ok: false, error: "Database unavailable." }, { status: 500 });
  }
}
