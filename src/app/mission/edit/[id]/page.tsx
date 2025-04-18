import NewMissionPage from "../../create/client";
import { mission } from "@/utils/data/mission";

export default async function EditMissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  console.log("id", id);
  const missionData = await mission.getMission(id);
  if (missionData.error) {
    return <div>Error: {missionData.error.message}</div>;
  }
  
  return <NewMissionPage editMissionData={missionData.data || undefined} />;
}
