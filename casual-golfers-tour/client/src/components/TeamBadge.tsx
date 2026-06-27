import type { Team } from '../types';

export function TeamBadge({ team }: { team: Team | null }) {
  if (!team) return <span className="text-gray-400 text-xs">Unassigned</span>;
  const styles = team === 'A' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700';
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${styles}`}>Team {team}</span>
  );
}
