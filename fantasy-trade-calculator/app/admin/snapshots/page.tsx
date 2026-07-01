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
        <h1 className="text-2xl font-bold text-white">Ranking Snapshots</h1>
        <Link
          href="/admin"
          className="rounded-full px-3 py-1.5 text-xs font-medium text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          style={{ border: "1px solid rgba(255,255,255,0.12)" }}
        >
          ← Players
        </Link>
      </div>

      {/* New snapshot form */}
      <form
        action={createSnapshotAction}
        className="glass-card flex flex-col gap-4 rounded-2xl p-5"
      >
        <div>
          <h2 className="text-sm font-semibold text-white/85">Start a new week</h2>
          <p className="mt-1 text-sm text-white/45">
            Copies every player&apos;s current value into a new snapshot, which you can then tweak
            without losing history.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input
            name="season"
            type="number"
            placeholder="Season"
            defaultValue={nextSeason}
            required
            className="glass-input rounded-xl px-3 py-2.5 text-sm"
          />
          <input
            name="week"
            type="number"
            placeholder="Week"
            defaultValue={nextWeek}
            required
            className="glass-input rounded-xl px-3 py-2.5 text-sm"
          />
          <input
            name="label"
            placeholder="Label (e.g. 2026 Week 2)"
            required
            className="glass-input col-span-2 rounded-xl px-3 py-2.5 text-sm"
          />
          <textarea
            name="notes"
            placeholder="Notes (optional)"
            rows={2}
            className="glass-input col-span-2 resize-none rounded-xl px-3 py-2.5 text-sm"
          />
        </div>
        <button
          type="submit"
          className="self-start rounded-full px-5 py-2 text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: "rgba(59,130,246,0.28)",
            border: "1px solid rgba(59,130,246,0.38)",
            boxShadow: "0 4px 16px rgba(59,130,246,0.18)",
          }}
        >
          Create snapshot
        </button>
      </form>

      {/* Snapshot list */}
      <div className="glass-card flex flex-col divide-glass rounded-2xl">
        {snapshots.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-white/35">No snapshots yet.</p>
        ) : (
          snapshots.map((snapshot) => (
            <div key={snapshot.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
              <div className="flex flex-col">
                <span className="font-medium text-white/88">{snapshot.label}</span>
                <span className="text-xs text-white/40">
                  Season {snapshot.season}, Week {snapshot.week} ·{" "}
                  {snapshot._count.values} player value{snapshot._count.values === 1 ? "" : "s"}
                </span>
              </div>
              <span className="text-xs text-white/30">
                {snapshot.createdAt.toLocaleDateString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}