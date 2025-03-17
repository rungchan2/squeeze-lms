import CreateJourneyPage from "@/app/create-journey/CreateJourneyFrom";
import { getJourney } from "../../actions";

export default async function page({ params }: { params: { slug: string } }) {
  const { data, error } = await getJourney(params.slug);
  if (error) {
    return <div>Error: {error.message}</div>;
  }
  return (
    <CreateJourneyPage initialData={data || undefined} />
  )
}
