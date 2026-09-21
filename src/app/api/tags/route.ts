import { handleApiError, ok } from "@/lib/api";
import { listTags } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tags = await listTags();
    return ok({ tags });
  } catch (error) {
    return handleApiError(error);
  }
}
