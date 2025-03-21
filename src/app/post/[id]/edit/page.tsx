import CreatePostFrom from "@/app/journey/[slug]/[id]/CreatePostFrom";
import { getPost } from "@/app/post/actions";
export default async function EditPostPage({ params }: { params: Promise<{ id: number }> }) {
  const { id } = await params;
  const post = await getPost(id);
  if (post.error || !post.data) {
    return <div>Error: {post.error?.message}</div>;
  }
  return <CreatePostFrom updateDataId={id} updateData={post.data} />;
}
