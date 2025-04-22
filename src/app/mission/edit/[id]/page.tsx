import NewMissionPage from "../../create/client";
import { getMissionById } from "@/app/journey/[slug]/actions";

export default async function EditMissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  console.log("id", id);
  const missionData = await getMissionById(id);
  console.log("missionData", missionData);
  if (missionData.error) {
    return <div>Error: {missionData.error.message}</div>;
  }
  
  return <NewMissionPage editMissionData={missionData.data || undefined} />;
}
