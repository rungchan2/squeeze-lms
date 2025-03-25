import CreatePostFrom from "@/app/journey/[slug]/[id]/CreatePostFrom";
import { posts } from "@/utils/posts/posts";

export default async function EditPostPage({ params }: { params: Promise<{ id: number }> }) {
  const { id } = await params;
  const post = await posts.getPost(id);
  if (post.error || !post.data) {
    return <div>Error: {post.error?.message}</div>;
  }
  return <CreatePostFrom updateDataId={id} updateData={post.data} />;
}
