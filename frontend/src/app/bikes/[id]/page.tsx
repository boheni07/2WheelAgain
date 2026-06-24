export default async function BikeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main>
      <h1>Bike Detail — {id}</h1>
    </main>
  );
}
