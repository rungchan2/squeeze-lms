import CreatePostFrom from "./CreatePostFrom";

export default async function JourneyPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  return <CreatePostFrom slug={slug} missionInstanceId={Number(id)} />;
}
