import { getRandomPlayerPair } from "@/lib/votes/votes";
import { submitVoteAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function VotePage() {
  const pair = await getRandomPlayerPair();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">Who would you rather have?</h1>
        <p className="text-sm text-zinc-500">Tap a player to vote.</p>
      </div>

      {!pair ? (
        <p className="text-sm text-zinc-500">
          Need at least 2 players with values to vote. Add some from the Admin Players page.
        </p>
      ) : (
        <form className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {pair.map((player) => (
            <button
              key={player.id}
              formAction={submitVoteAction.bind(null, pair[0].id, pair[1].id, player.id)}
              className="flex flex-col items-center gap-2 rounded-lg border border-zinc-200 p-6 text-center transition-colors hover:border-blue-500 hover:bg-blue-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
            >
              <span className="text-lg font-semibold">{player.name}</span>
              <span className="text-sm text-zinc-500">
                {player.position}
                {player.team ? ` - ${player.team}` : ""}
              </span>
            </button>
          ))}
        </form>
      )}
    </div>
  );
}
