import Link from "next/link";
import { AdminNotice } from "@/components/AdminNotice";
import { listPlayersWithValues } from "@/lib/players/players";
import { createPlayerAction, setPlayerValueAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPlayersPage() {
  const players = await listPlayersWithValues();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <AdminNotice />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Players</h1>
        <div className="flex items-center gap-4">
          <Link href="/admin/import" className="text-sm font-medium text-blue-600 hover:underline">
            Import →
          </Link>
          <Link href="/admin/snapshots" className="text-sm font-medium text-blue-600 hover:underline">
            Manage snapshots →
          </Link>
        </div>
      </div>

      <form
        action={createPlayerAction}
        className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
      >
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Add player</h2>
        <div className="grid grid-cols-2 gap-3">
          <input
            name="name"
            placeholder="Name"
            required
            className="col-span-2 rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <input
            name="position"
            placeholder="Position (e.g. RB)"
            required
            className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <input
            name="team"
            placeholder="Team (optional)"
            className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <input
            name="value"
            type="number"
            min={1}
            max={100}
            placeholder="Value 1-100 (optional)"
            className="col-span-2 rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <button
          type="submit"
          className="self-start rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add player
        </button>
      </form>

      <div className="flex flex-col divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {players.length === 0 ? (
          <p className="px-4 py-6 text-sm text-zinc-500">No players yet. Add one above.</p>
        ) : (
          players.map((player) => (
            <div key={player.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex flex-col">
                <span className="font-medium">{player.name}</span>
                <span className="text-sm text-zinc-500">
                  {player.position}
                  {player.team ? ` - ${player.team}` : ""}
                </span>
              </div>
              <form
                action={setPlayerValueAction.bind(null, player.id)}
                className="flex items-center gap-2"
              >
                <input
                  name="value"
                  type="number"
                  min={1}
                  max={100}
                  defaultValue={player.value ?? undefined}
                  className="w-20 rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
                <button
                  type="submit"
                  className="rounded-md border border-zinc-300 px-3 py-1 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Save
                </button>
              </form>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
