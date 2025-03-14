
type Params = Promise<{ id: number }>;

export default async function JourneyPage({ params }: { params: Params }) {
  const { id } = await params;
  return (
    <>
      <p>id : {id}</p> 
    </>
  );
}
