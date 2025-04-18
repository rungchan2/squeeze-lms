import NewMissionPage from "../../create/client";
import { getMission } from "@/app/journey/[slug]/clientActions";

export default async function EditMissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  console.log("id", id);
  const mission = await getMission(id);
  if (mission.error) {
    return <div>Error: {mission.error.message}</div>;
  }
  
  return <NewMissionPage editMissionData={mission.data || undefined} />;
}
