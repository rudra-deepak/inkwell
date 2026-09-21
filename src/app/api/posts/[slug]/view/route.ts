import { handleApiError, ok } from "@/lib/api";
import { registerView } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const views = await registerView(slug);
    return ok({ views });
  } catch (error) {
    return handleApiError(error);
  }
}
