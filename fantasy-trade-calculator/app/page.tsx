import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-8 px-4 py-12 text-center">
      <div>
        <h1 className="text-3xl font-bold">Fantasy Trade Calculator</h1>
        <p className="mt-2 text-zinc-500">
          Compare players, check trades, and track value over the season.
        </p>
      </div>
      <div className="flex w-full flex-col gap-3">
        <Link
          href="/calculator"
          className="rounded-lg bg-blue-600 px-6 py-4 text-base font-semibold text-white hover:bg-blue-700"
        >
          Trade Calculator
        </Link>
        <Link
          href="/vote"
          className="rounded-lg bg-zinc-900 px-6 py-4 text-base font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Vote: Player vs Player
        </Link>
        <Link
          href="/admin"
          className="rounded-lg border border-zinc-300 px-6 py-4 text-base font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          Admin
        </Link>
      </div>
    </div>
  );
}
