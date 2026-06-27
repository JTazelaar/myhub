import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../../api/client';
import { Card } from '../../../components/Card';
import { EmptyState } from '../../../components/EmptyState';
import { LoadingState, ErrorState } from '../../../components/LoadingState';
import { FormatBadge } from '../../../components/FormatBadge';
import type { EventDetail, Foursome, Format, Player } from '../../../types';
import { FORMAT_LABELS } from '../../../types';
import { WizardHeader } from './WizardHeader';

const FORMATS: Format[] = ['scramble', 'best_ball', 'alternate_shot', 'one_v_one'];

interface PairDraft {
  team_a_player_id: number | '';
  team_b_player_id: number | '';
}

function pairsFromFoursome(f: Foursome): PairDraft[] {
  const teamA = f.players.filter((p) => p.team === 'A');
  const teamB = f.players.filter((p) => p.team === 'B');
  const isMatchup = f.format === 'best_ball' || f.format === 'one_v_one';
  return teamA.map((a, i) => {
    if (isMatchup && a.partner_player_id != null) {
      return { team_a_player_id: a.player_id, team_b_player_id: a.partner_player_id };
    }
    return { team_a_player_id: a.player_id, team_b_player_id: teamB[i]?.player_id ?? '' };
  });
}

function nameOf(players: Player[], id: number | '') {
  return players.find((p) => p.id === id)?.name ?? '—';
}

export default function Step3Foursomes() {
  const { id } = useParams();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [players, setPlayers] = useState<Player[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ segmentId: number; foursome: Foursome | null } | null>(null);

  useEffect(() => {
    api
      .get<EventDetail>(`/events/${id}`)
      .then(setEvent)
      .catch((e) => setError(e.message));
    api
      .get<Player[]>('/players')
      .then(setPlayers)
      .catch((e) => setError(e.message));
  }, [id]);

  async function handleDelete(f: Foursome) {
    if (!confirm(`Delete foursome "${f.name}"?`)) return;
    const updated = await api.delete<EventDetail>(`/foursomes/${f.id}`);
    setEvent(updated);
  }

  if (error && (!event || !players)) return <ErrorState message={error} />;
  if (!event || !players) return <LoadingState />;

  const teamAPlayers = players.filter((p) => p.team === 'A');
  const teamBPlayers = players.filter((p) => p.team === 'B');

  return (
    <div className="space-y-8">
      <WizardHeader event={event} eventId={id!} onEventUpdated={setEvent} />

      {event.segments.length === 0 ? (
        <EmptyState title="No segments yet" subtitle="Build segments before adding foursomes." />
      ) : (
        event.segments.map((seg) => (
          <section key={seg.id} className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-bold text-green-800">
                {seg.name}{' '}
                <span className="text-sm font-normal text-green-500">
                  (Holes {seg.hole_start}&ndash;{seg.hole_end})
                </span>
              </h2>
              <button
                onClick={() => setEditing({ segmentId: seg.id, foursome: null })}
                className="rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white hover:bg-orange-600"
              >
                + Add Foursome
              </button>
            </div>

            {seg.foursomes.length === 0 ? (
              <EmptyState emoji="👥" title="No foursomes yet" subtitle="Add a foursome to pair up players for this segment." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {seg.foursomes.map((f) => (
                  <Card key={f.id}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-display font-bold text-green-900">{f.name}</p>
                      <FormatBadge format={f.format} />
                    </div>
                    <div className="space-y-1 text-sm">
                      {pairsFromFoursome(f).map((pair, i) => (
                        <p key={i}>
                          <span className="font-bold text-emerald-700">{nameOf(players, pair.team_a_player_id)}</span>
                          <span className="text-green-400"> vs </span>
                          <span className="font-bold text-orange-700">{nameOf(players, pair.team_b_player_id)}</span>
                        </p>
                      ))}
                    </div>
                    <div className="mt-3 flex gap-3 text-sm font-bold">
                      <button
                        onClick={() => setEditing({ segmentId: seg.id, foursome: f })}
                        className="text-green-700 hover:underline"
                      >
                        Edit
                      </button>
                      <button onClick={() => handleDelete(f)} className="text-rose-600 hover:underline">
                        Delete
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        ))
      )}

      {editing && (
        <FoursomeFormModal
          segmentId={editing.segmentId}
          foursome={editing.foursome}
          teamAPlayers={teamAPlayers}
          teamBPlayers={teamBPlayers}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setEvent(updated);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function FoursomeFormModal({
  segmentId,
  foursome,
  teamAPlayers,
  teamBPlayers,
  onClose,
  onSaved
}: {
  segmentId: number;
  foursome: Foursome | null;
  teamAPlayers: Player[];
  teamBPlayers: Player[];
  onClose: () => void;
  onSaved: (event: EventDetail) => void;
}) {
  const [name, setName] = useState(foursome?.name ?? '');
  const [format, setFormat] = useState<Format>(foursome?.format ?? 'scramble');
  const [pairs, setPairs] = useState<PairDraft[]>(
    foursome
      ? pairsFromFoursome(foursome)
      : [
          { team_a_player_id: '', team_b_player_id: '' },
          { team_a_player_id: '', team_b_player_id: '' }
        ]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updatePair(i: number, side: 'team_a_player_id' | 'team_b_player_id', value: string) {
    setPairs((prev) => prev.map((p, idx) => (idx === i ? { ...p, [side]: value ? Number(value) : '' } : p)));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const allIds = pairs.flatMap((p) => [p.team_a_player_id, p.team_b_player_id]);
    if (allIds.some((v) => v === '')) {
      setError('Pick all 4 players.');
      return;
    }
    if (new Set(allIds).size !== 4) {
      setError('All 4 players must be different.');
      return;
    }

    setSaving(true);
    try {
      const body = { segment_id: segmentId, name: name.trim() || 'Foursome', format, pairs };
      const updated = foursome
        ? await api.put<EventDetail>(`/foursomes/${foursome.id}`, body)
        : await api.post<EventDetail>('/foursomes', body);
      onSaved(updated);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4 py-8 overflow-y-auto">
      <Card className="w-full max-w-lg">
        <h3 className="font-display text-lg font-bold text-green-900 mb-4">
          {foursome ? 'Edit Foursome' : 'Add Foursome'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="flex flex-col gap-1 text-sm font-bold text-green-800">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Group 1"
              className="rounded-lg border-2 border-green-200 px-3 py-2 font-normal"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-bold text-green-800">
            Format
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as Format)}
              className="rounded-lg border-2 border-green-200 px-3 py-2 font-normal"
            >
              {FORMATS.map((f) => (
                <option key={f} value={f}>
                  {FORMAT_LABELS[f]}
                </option>
              ))}
            </select>
          </label>

          <p className="text-xs text-green-500">
            {format === 'best_ball' || format === 'one_v_one'
              ? 'Each matchup below pairs a Team A player against a Team B player.'
              : 'These 4 players play together as one group for this format.'}
          </p>

          {pairs.map((pair, i) => (
            <div key={i} className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-xs font-bold text-emerald-700">
                Team A
                <select
                  value={pair.team_a_player_id}
                  onChange={(e) => updatePair(i, 'team_a_player_id', e.target.value)}
                  className="rounded-lg border-2 border-green-200 px-3 py-2 font-normal text-sm"
                >
                  <option value="">Select player</option>
                  {teamAPlayers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs font-bold text-orange-700">
                Team B
                <select
                  value={pair.team_b_player_id}
                  onChange={(e) => updatePair(i, 'team_b_player_id', e.target.value)}
                  className="rounded-lg border-2 border-green-200 px-3 py-2 font-normal text-sm"
                >
                  <option value="">Select player</option>
                  {teamBPlayers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ))}

          {error && <p className="text-sm font-bold text-rose-600">{error}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-green-600 px-5 py-2 font-bold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Foursome'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-gray-200 px-5 py-2 font-bold text-gray-700 hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
