import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div>
        <h1 className="text-2xl font-bold text-[#1a3a2a]">Not Found</h1>
        <p className="mt-2 text-gray-600">Could not find the requested resource.</p>
        <Link
          href="/"
          className="mt-4 inline-block rounded bg-[#2d6a4f] px-4 py-2 text-white"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
