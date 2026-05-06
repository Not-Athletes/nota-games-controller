import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 border border-zinc-300 bg-white p-8 text-center">
        <p className="font-brand text-lg font-bold tracking-[0.06em] text-zinc-600 md:text-xl">
          Not Athletes Games
        </p>
        <h1 className="text-3xl font-semibold text-zinc-900 md:text-4xl">404</h1>
        <p className="text-zinc-700">This page could not be found.</p>
        <Link
          href="/"
          className="mx-auto mt-2 inline-flex rounded-sm bg-zinc-900 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}
