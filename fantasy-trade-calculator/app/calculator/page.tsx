import { listPlayersWithValues } from "@/lib/players/players";
import { TradeCalculator, type CalculatorPlayer } from "@/components/TradeCalculator";

export const dynamic = "force-dynamic";

export default async function CalculatorPage() {
  const players = await listPlayersWithValues();
  const valued = players.filter((p): p is typeof p & { value: number } => p.value !== null);
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">Trade Calculator</h1>
        <p className="text-sm text-zinc-500">Add players to each side to see who wins the trade.</p>
      </div>
      {valued.length === 0 ? (
        <p className="text-sm text-zinc-500">No players have values yet. Add some from the Admin Players page.</p>
      ) : (
        <TradeCalculator players={valued satisfies CalculatorPlayer[]} />
      )}
    </div>
  );
}
