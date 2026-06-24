export default async function BookDocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <main>
      <h1>Book — {slug}</h1>
    </main>
  );
}
