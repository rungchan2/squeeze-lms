import CreateJourneyPage from "@/app/create-journey/CreateJourneyFrom";
import { getJourneyByUuid } from "../actions";

type Params = Promise<{ slug: string }>;

export default async function Page({ params }: { params: Params }) {
  const { slug } = await params;
  const { data, error } = await getJourneyByUuid(slug);
  if (error) {
    return <div>Error</div>;
  }
  return <CreateJourneyPage initialData={data || undefined} />;
}

