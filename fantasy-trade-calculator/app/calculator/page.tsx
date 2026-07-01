import { listPlayersWithValues } from "@/lib/players/players";
import { TradeCalculator, type CalculatorPlayer } from "@/components/TradeCalculator";

export const dynamic = "force-dynamic";

export default async function CalculatorPage() {
  const players = await listPlayersWithValues();
  const valued = players.filter((p): p is typeof p & { value: number } => p.value !== null);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Trade Calculator</h1>
        <p className="mt-1 text-sm text-white/45">
          Add players to each side to see who wins the trade.
        </p>
      </div>

      {valued.length === 0 ? (
        <div className="glass-card rounded-2xl px-6 py-12 text-center text-sm text-white/45">
          No players have values yet. Add some from the Admin Players page.
        </div>
      ) : (
        <TradeCalculator players={valued satisfies CalculatorPlayer[]} />
      )}
    </div>
  );
}