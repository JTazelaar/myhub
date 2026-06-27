import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../../api/client';
import { Card } from '../../../components/Card';
import { EmptyState } from '../../../components/EmptyState';
import { LoadingState, ErrorState } from '../../../components/LoadingState';
import { FormatBadge } from '../../../components/FormatBadge';
import type { EventDetail, Foursome } from '../../../types';
import { WizardHeader } from './WizardHeader';

function ScorePanel({
  foursome,
  handicapsEnabled,
  onSaved
}: {
  foursome: Foursome;
  handicapsEnabled: boolean;
  onSaved: (event: EventDetail) => void;
}) {
  const isGroup = foursome.format === 'scramble' || foursome.format === 'alternate_shot';
  const scoreByPlayer = new Map(foursome.scores.map((s) => [s.player_id, s]));
  const groupScore = foursome.scores.find((s) => s.player_id === null);

  const [groupGross, setGroupGross] = useState(groupScore?.gross_score != null ? String(groupScore.gross_score) : '');
  const [playerGross, setPlayerGross] = useState<Record<number, string>>(
    Object.fromEntries(
      foursome.players.map((p) => [
        p.player_id,
        scoreByPlayer.get(p.player_id)?.gross_score != null ? String(scoreByPlayer.get(p.player_id)!.gross_score) : ''
      ])
    )
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const updated = isGroup
        ? await api.put<EventDetail>(`/foursomes/${foursome.id}/scores`, {
            gross_score: groupGross === '' ? null : Number(groupGross)
          })
        : await api.put<EventDetail>(`/foursomes/${foursome.id}/scores`, {
            scores: foursome.players.map((p) => ({
              player_id: p.player_id,
              gross_score: playerGross[p.player_id] === '' ? null : Number(playerGross[p.player_id])
            }))
          });
      onSaved(updated);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <p className="font-display font-bold text-green-900">{foursome.name}</p>
        <FormatBadge format={foursome.format} />
      </div>

      {isGroup ? (
        <div className="space-y-2">
          <p className="text-xs font-bold text-green-600">{foursome.players.map((p) => p.name).join(', ')}</p>
          <label className="flex items-center gap-2 text-sm font-bold text-green-800">
            Group gross score
            <input
              type="number"
              value={groupGross}
              onChange={(e) => setGroupGross(e.target.value)}
              className="w-24 rounded-lg border-2 border-green-200 px-3 py-1.5 font-normal"
            />
          </label>
          {handicapsEnabled && groupScore?.net_score != null && (
            <p className="text-sm text-green-500">Net: {groupScore.net_score}</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {(['A', 'B'] as const).map((team) => (
            <div key={team}>
              <p className="text-xs font-bold text-green-600 mb-1">Team {team}</p>
              {foursome.players
                .filter((p) => p.team === team)
                .map((p) => {
                  const existing = scoreByPlayer.get(p.player_id);
                  return (
                    <div key={p.id} className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm">{p.name}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={playerGross[p.player_id]}
                          onChange={(e) => setPlayerGross((prev) => ({ ...prev, [p.player_id]: e.target.value }))}
                          className="w-20 rounded-lg border-2 border-green-200 px-2 py-1 font-normal text-sm"
                        />
                        {handicapsEnabled && existing?.net_score != null && (
                          <span className="text-xs text-green-500">net {existing.net_score}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      )}

      {error && <p className="mt-2 text-sm font-bold text-rose-600">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-3 rounded-full bg-green-600 px-4 py-1.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Score'}
      </button>
    </Card>
  );
}

export default function Step4Scores() {
  const { id } = useParams();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<EventDetail>(`/events/${id}`)
      .then(setEvent)
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <ErrorState message={error} />;
  if (!event) return <LoadingState />;

  const hasFoursomes = event.segments.some((seg) => seg.foursomes.length > 0);

  return (
    <div className="space-y-8">
      <WizardHeader event={event} eventId={id!} onEventUpdated={setEvent} />

      {!hasFoursomes ? (
        <EmptyState title="No foursomes yet" subtitle="Build foursomes before entering scores." />
      ) : (
        event.segments.map((seg) => (
          <section key={seg.id} className="space-y-3">
            <h2 className="font-display text-lg font-bold text-green-800">
              {seg.name}{' '}
              <span className="text-sm font-normal text-green-500">
                (Holes {seg.hole_start}&ndash;{seg.hole_end})
              </span>
            </h2>
            {seg.foursomes.length === 0 ? (
              <EmptyState emoji="📝" title="No foursomes in this segment" />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {seg.foursomes.map((f) => (
                  <ScorePanel key={f.id} foursome={f} handicapsEnabled={event.handicaps_enabled} onSaved={setEvent} />
                ))}
              </div>
            )}
          </section>
        ))
      )}
    </div>
  );
}
