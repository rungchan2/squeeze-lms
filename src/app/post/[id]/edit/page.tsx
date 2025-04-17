import CreatePostFrom from "@/app/journey/[slug]/[id]/CreatePostFrom";
import { getPost } from "@/app/post/actions";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data, error } = await getPost(id);
  if (error || !data) {
    return <div>Error: {error?.message}</div>;
  }
  const updateData = {
    title: data.title,
    content: data.content || "",
    user_id: data.user_id,
  };
  return (
    <CreatePostFrom
      slug={data.mission_instance?.journey_uuid}
      updateDataId={id}
      updateData={updateData}
      missionInstanceId={data.mission_instance?.id || ""}
    />
  );
}
