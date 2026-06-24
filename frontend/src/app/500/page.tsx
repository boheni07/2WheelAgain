export default function ServerError() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div>
        <h1 className="text-2xl font-bold text-[#1a3a2a]">Something went wrong</h1>
        <p className="mt-2 text-gray-600">
          An unexpected error occurred. Please try again later.
        </p>
      </div>
    </div>
  );
}
