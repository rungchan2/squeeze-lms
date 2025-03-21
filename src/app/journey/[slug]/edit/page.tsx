import CreateJourneyPage from "@/app/create-journey/CreateJourneyFrom";
import { getJourney } from "../../actions";

type Params = Promise<{ slug: string }>;

export default async function Page({ params }: { params: Params }) {
  const { slug } = await params;
  const { data, error } = await getJourney(slug);
  if (error) {
    return <div>Error: {error.message}</div>;
  }
  return <CreateJourneyPage initialData={data || undefined} />;
}

//TODO: 1. 포스트 자신 포스트만 수정할 수 있게 하기
