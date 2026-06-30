import Link from "next/link";
import { AdminNotice } from "@/components/AdminNotice";
import { getLatestSnapshot, listSnapshots } from "@/lib/rankings/snapshots";
import { createSnapshotAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminSnapshotsPage() {
  const [snapshots, latest] = await Promise.all([listSnapshots(), getLatestSnapshot()]);
  const nextSeason = latest?.season ?? new Date().getFullYear();
  const nextWeek = latest ? latest.week + 1 : 1;
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <AdminNotice />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ranking snapshots</h1>
        <Link href="/admin" className="text-sm font-medium text-blue-600 hover:underline">← Players</Link>
      </div>
      <form action={createSnapshotAction} className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Start a new week</h2>
        <p className="text-sm text-zinc-500">Copies every player&apos;s current value into a new snapshot.</p>
        <div className="grid grid-cols-2 gap-3">
          <input name="season" type="number" placeholder="Season" defaultValue={nextSeason} required className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
          <input name="week" type="number" placeholder="Week" defaultValue={nextWeek} required className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
          <input name="label" placeholder="Label (e.g. 2026 Week 2)" required className="col-span-2 rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
          <textarea name="notes" placeholder="Notes (optional)" className="col-span-2 rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
        </div>
        <button type="submit" className="self-start rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Create snapshot</button>
      </form>
      <div className="flex flex-col divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {snapshots.length === 0 ? (
          <p className="px-4 py-6 text-sm text-zinc-500">No snapshots yet.</p>
        ) : (
          snapshots.map((snapshot) => (
            <div key={snapshot.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex flex-col">
                <span className="font-medium">{snapshot.label}</span>
                <span className="text-sm text-zinc-500">Season {snapshot.season}, Week {snapshot.week} · {snapshot._count.values} player value{snapshot._count.values === 1 ? "" : "s"}</span>
              </div>
              <span className="text-xs text-zinc-400">{snapshot.createdAt.toLocaleDateString()}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
