import { Link } from 'react-router-dom';
import type { EventPoints } from '../types';

export function PointsTable({ points }: { points: EventPoints[] }) {
  const sorted = [...points].sort((a, b) => (a.placement ?? 99) - (b.placement ?? 99));
  return (
    <div className="overflow-x-auto rounded-xl border-2 border-green-100">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="bg-green-100 text-green-800 uppercase text-xs">
            <th className="px-3 py-2">Place</th>
            <th className="px-3 py-2">Player</th>
            <th className="px-3 py-2 text-right">Points</th>
            <th className="px-3 py-2">Notes</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => (
            <tr key={p.id} className="border-t border-green-50">
              <td className="px-3 py-2 font-bold text-green-700">{p.placement ?? '—'}</td>
              <td className="px-3 py-2">
                <Link to={`/players/${p.player_id}`} className="font-bold hover:underline">
                  {p.player_name}
                </Link>
                {p.player_nickname && <span className="ml-1 italic text-green-500">"{p.player_nickname}"</span>}
              </td>
              <td className="px-3 py-2 text-right font-display font-bold text-orange-500">{p.points}</td>
              <td className="px-3 py-2 text-green-600">{p.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
