import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../../api/client';
import { Card } from '../../../components/Card';
import { LoadingState, ErrorState } from '../../../components/LoadingState';
import type { EventDetail, Player } from '../../../types';
import { WizardHeader } from './WizardHeader';

interface PointsRow {
  placement: string;
  points: string;
  notes: string;
}

export default function Step5Points() {
  const { id } = useParams();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [players, setPlayers] = useState<Player[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Record<number, PointsRow>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([api.get<EventDetail>(`/events/${id}`), api.get<Player[]>('/players')])
      .then(([ev, pl]) => {
        setEvent(ev);
        setPlayers(pl);
        const existing = new Map(ev.points.map((p) => [p.player_id, p]));
        setRows(
          Object.fromEntries(
            pl.map((p) => {
              const e = existing.get(p.id);
              return [
                p.id,
                {
                  placement: e?.placement != null ? String(e.placement) : '',
                  points: e?.points != null ? String(e.points) : '0',
                  notes: e?.notes ?? ''
                }
              ];
            })
          )
        );
      })
      .catch((e) => setError(e.message));
  }, [id]);

  function updateRow(playerId: number, field: keyof PointsRow, value: string) {
    setRows((prev) => ({ ...prev, [playerId]: { ...prev[playerId], [field]: value } }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const updated = await api.put<EventDetail>(`/events/${id}/points`, {
        points: Object.entries(rows).map(([player_id, r]) => ({
          player_id: Number(player_id),
          placement: r.placement === '' ? null : Number(r.placement),
          points: Number(r.points) || 0,
          notes: r.notes || null
        }))
      });
      setEvent(updated);
      setSaved(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (error && (!event || !players)) return <ErrorState message={error} />;
  if (!event || !players) return <LoadingState />;

  const sortedPlayers = [...players].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-8">
      <WizardHeader event={event} eventId={id!} onEventUpdated={setEvent} />

      <section className="space-y-4">
        <h2 className="font-display text-lg font-bold text-green-800">Final Points</h2>
        <p className="text-sm text-green-600">
          Enter each player's placement, points, and an optional note. Saving marks this event as completed.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-green-100 text-green-800 uppercase text-xs">
                    <th className="px-3 py-2">Player</th>
                    <th className="px-3 py-2">Placement</th>
                    <th className="px-3 py-2">Points</th>
                    <th className="px-3 py-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPlayers.map((p) => (
                    <tr key={p.id} className="border-t border-green-50">
                      <td className="px-3 py-2">
                        <span className="font-bold text-green-900">{p.name}</span>
                        {p.nickname && <span className="ml-1 italic text-green-500">"{p.nickname}"</span>}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={1}
                          max={players.length}
                          value={rows[p.id]?.placement ?? ''}
                          onChange={(e) => updateRow(p.id, 'placement', e.target.value)}
                          className="w-16 rounded-lg border-2 border-green-200 px-2 py-1"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={rows[p.id]?.points ?? ''}
                          onChange={(e) => updateRow(p.id, 'points', e.target.value)}
                          className="w-20 rounded-lg border-2 border-green-200 px-2 py-1"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={rows[p.id]?.notes ?? ''}
                          onChange={(e) => updateRow(p.id, 'notes', e.target.value)}
                          placeholder="Optional note"
                          className="w-full rounded-lg border-2 border-green-200 px-2 py-1"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {error && <p className="text-sm font-bold text-rose-600">{error}</p>}

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-green-600 px-6 py-2 font-bold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save & Complete Event'}
            </button>
            {saved && <span className="text-sm font-bold text-green-700">Saved! Event marked completed.</span>}
          </div>
        </form>
      </section>
    </div>
  );
}
