import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getPostBySlug } from "@/lib/store";
import { PostEditor } from "@/components/post-editor";

export const dynamic = "force-dynamic";

export default async function EditPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser();
  const post = await getPostBySlug(slug, user.id);
  if (!post || !post.isAuthor) notFound();

  return (
    <div className="pt-8">
      <PostEditor mode="edit" post={post} />
    </div>
  );
}
