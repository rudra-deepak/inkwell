import { requireUser } from "@/lib/auth";
import { PostEditor } from "@/components/post-editor";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  await requireUser();
  return (
    <div className="pt-8">
      <PostEditor mode="create" />
    </div>
  );
}
