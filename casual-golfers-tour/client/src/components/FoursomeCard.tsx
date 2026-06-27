import type { Foursome } from '../types';
import { FormatBadge } from './FormatBadge';

function ScoreText({ gross, net, handicapsEnabled }: { gross: number | null; net?: number | null; handicapsEnabled: boolean }) {
  if (gross === null || gross === undefined) return <span className="text-gray-400">—</span>;
  return (
    <span>
      {gross}
      {handicapsEnabled && net !== null && net !== undefined && <span className="text-green-500"> (net {net})</span>}
    </span>
  );
}

export function FoursomeCard({ foursome, handicapsEnabled }: { foursome: Foursome; handicapsEnabled: boolean }) {
  const teamA = foursome.players.filter((p) => p.team === 'A');
  const teamB = foursome.players.filter((p) => p.team === 'B');
  const scoreByPlayer = new Map(foursome.scores.map((s) => [s.player_id, s]));
  const groupScore = foursome.scores.find((s) => s.player_id === null);

  return (
    <div className="rounded-xl border-2 border-green-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="font-display font-bold text-green-900">{foursome.name}</p>
        <FormatBadge format={foursome.format} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-emerald-50 p-2">
          <p className="text-xs font-bold text-emerald-600 mb-1">Team A</p>
          {teamA.map((p) => (
            <div key={p.id} className="flex justify-between">
              <span>{p.name}</span>
              {!(foursome.format === 'scramble' || foursome.format === 'alternate_shot') && (
                <ScoreText
                  gross={scoreByPlayer.get(p.player_id)?.gross_score ?? null}
                  net={scoreByPlayer.get(p.player_id)?.net_score}
                  handicapsEnabled={handicapsEnabled}
                />
              )}
            </div>
          ))}
        </div>
        <div className="rounded-lg bg-orange-50 p-2">
          <p className="text-xs font-bold text-orange-600 mb-1">Team B</p>
          {teamB.map((p) => (
            <div key={p.id} className="flex justify-between">
              <span>{p.name}</span>
              {!(foursome.format === 'scramble' || foursome.format === 'alternate_shot') && (
                <ScoreText
                  gross={scoreByPlayer.get(p.player_id)?.gross_score ?? null}
                  net={scoreByPlayer.get(p.player_id)?.net_score}
                  handicapsEnabled={handicapsEnabled}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {(foursome.format === 'scramble' || foursome.format === 'alternate_shot') && (
        <p className="mt-3 text-center text-sm font-bold text-green-800">
          Group score:{' '}
          <ScoreText gross={groupScore?.gross_score ?? null} net={groupScore?.net_score} handicapsEnabled={handicapsEnabled} />
        </p>
      )}

      {foursome.format === 'best_ball' && foursome.summary?.teamA && foursome.summary?.teamB && (
        <p className="mt-3 text-center text-sm font-bold text-green-800">
          Best ball: A {foursome.summary.teamA.bestNet ?? foursome.summary.teamA.bestGross} vs B{' '}
          {foursome.summary.teamB.bestNet ?? foursome.summary.teamB.bestGross}
          {foursome.summary.leadingTeam && foursome.summary.leadingTeam !== 'tie' && (
            <span className="text-orange-500"> &mdash; Team {foursome.summary.leadingTeam} ahead</span>
          )}
        </p>
      )}

      {foursome.format === 'one_v_one' && foursome.summary?.matchups && (
        <div className="mt-3 space-y-1 text-sm">
          {foursome.summary.matchups.map((m, i) => (
            <p key={i} className="text-center">
              <span className={m.winnerPlayerId === m.playerA.id ? 'font-bold text-orange-500' : ''}>{m.playerA.name}</span>
              {' vs '}
              <span className={m.winnerPlayerId === m.playerB.id ? 'font-bold text-orange-500' : ''}>{m.playerB.name}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
