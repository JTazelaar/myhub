import { Suspense } from "react";
import { FormatPicker } from "@/components/FormatPicker";
import { TeamLogo } from "@/components/TeamLogo";
import { getRandomPlayerPair } from "@/lib/votes/votes";
import { FORMAT_MAP, DEFAULT_FORMAT_ID } from "@/lib/formats";
import { submitVoteAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function VotePage({
  searchParams,
}: {
  searchParams: Promise<{ format?: string }>;
}) {
  const { format: rawFormat } = await searchParams;
  const formatId = FORMAT_MAP.has(rawFormat ?? "") ? (rawFormat as string) : DEFAULT_FORMAT_ID;
  const format = FORMAT_MAP.get(formatId)!;

  const pair = await getRandomPlayerPair(formatId);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">Who would you rather have?</h1>
        <p className="mt-2 text-sm text-white/45">Tap a player to cast your vote.</p>
      </div>

      {/* Format selector */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Suspense fallback={<div className="h-14" />}>
          <FormatPicker formatId={formatId} basePath="/vote" showTePremium={false} />
        </Suspense>
        <p className="mt-2 text-xs text-white/30">
          {format.label} · Pairs are selected based on this format's values
        </p>
      </div>

      {/* Player pair */}
      {!pair ? (
        <div className="glass-card rounded-2xl px-6 py-12 text-center text-sm text-white/45">
          Need at least 2 players with values to vote. Add some from the Admin Players page.
        </div>
      ) : (
        <form className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {pair.map((player) => (
            <button
              key={player.id}
              formAction={submitVoteAction.bind(null, pair[0].id, pair[1].id, player.id, formatId)}
              className="glass-card group flex flex-col items-center gap-3 rounded-2xl p-8 text-center transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{ cursor: "pointer" }}
            >
              <TeamLogo team={player.team} size={36} />
              <span className="text-lg font-bold text-white group-hover:text-blue-200 transition-colors">
                {player.name}
              </span>
              <span className="text-sm text-white/50">
                {player.position}
                {player.team ? ` · ${player.team}` : ""}
              </span>
              <span className="text-xs text-white/30">Value: {player.value}</span>
            </button>
          ))}
        </form>
      )}
    </div>
  );
}
