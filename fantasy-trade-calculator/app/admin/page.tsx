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

      {/* Header + nav */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Players</h1>
        <div className="flex items-center gap-2">
          {[
            { href: "/admin/rankings", label: "Rankings" },
            { href: "/admin/ktc", label: "KTC" },
            { href: "/admin/import", label: "Import" },
            { href: "/admin/snapshots", label: "Snapshots" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-white/55 transition-colors hover:bg-white/10 hover:text-white"
              style={{ border: "1px solid rgba(255,255,255,0.12)" }}
            >
              {label} →
            </Link>
          ))}
        </div>
      </div>

      {/* Add player form */}
      <form
        action={createPlayerAction}
        className="glass-card flex flex-col gap-4 rounded-2xl p-5"
      >
        <h2 className="text-sm font-semibold text-white/70">Add player</h2>
        <div className="grid grid-cols-2 gap-3">
          <input
            name="name"
            placeholder="Name"
            required
            className="glass-input col-span-2 rounded-xl px-3 py-2.5 text-sm"
          />
          <input
            name="position"
            placeholder="Position (e.g. RB)"
            required
            className="glass-input rounded-xl px-3 py-2.5 text-sm"
          />
          <input
            name="team"
            placeholder="Team (optional)"
            className="glass-input rounded-xl px-3 py-2.5 text-sm"
          />
          <input
            name="value"
            type="number"
            min={1}
            max={100}
            placeholder="Value 1–100 (optional)"
            className="glass-input col-span-2 rounded-xl px-3 py-2.5 text-sm"
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
          Add player
        </button>
      </form>

      {/* Player list */}
      <div className="glass-card flex flex-col divide-glass rounded-2xl">
        {players.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-white/40">
            No players yet. Add one above.
          </p>
        ) : (
          players.map((player) => (
            <div key={player.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="flex min-w-0 flex-col">
                <span className="font-medium text-white/90">{player.name}</span>
                <span className="text-xs text-white/40">
                  {player.position}
                  {player.team ? ` · ${player.team}` : ""}
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
                  className="glass-input w-20 rounded-xl px-2.5 py-1.5 text-center text-sm"
                />
                <button
                  type="submit"
                  className="rounded-full px-3 py-1.5 text-xs font-medium text-white/55 transition-colors hover:bg-white/10 hover:text-white"
                  style={{ border: "1px solid rgba(255,255,255,0.12)" }}
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
