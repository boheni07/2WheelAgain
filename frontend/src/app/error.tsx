'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div>
        <h1 className="text-2xl font-bold text-[#1a3a2a]">Something went wrong</h1>
        <p className="mt-2 text-gray-600">
          An unexpected error occurred. Please try again later.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-4 rounded bg-[#2d6a4f] px-4 py-2 text-white"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
