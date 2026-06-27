import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../../api/client';
import { Card } from '../../../components/Card';
import { LoadingState, ErrorState } from '../../../components/LoadingState';
import type { EventDetail } from '../../../types';
import { WizardHeader } from './WizardHeader';

interface SegmentDraft {
  name: string;
  hole_start: number;
  hole_end: number;
}

function suggestSegments(totalHoles: 18 | 36): SegmentDraft[] {
  if (totalHoles === 18) {
    return [
      { name: 'Front 9', hole_start: 1, hole_end: 9 },
      { name: 'Back 9', hole_start: 10, hole_end: 18 }
    ];
  }
  return [
    { name: 'Round 1 - Front 9', hole_start: 1, hole_end: 9 },
    { name: 'Round 1 - Back 9', hole_start: 10, hole_end: 18 },
    { name: 'Round 2 - Front 9', hole_start: 19, hole_end: 27 },
    { name: 'Round 2 - Back 9', hole_start: 28, hole_end: 36 }
  ];
}

export default function Step2Segments() {
  const { id } = useParams();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<SegmentDraft[]>([]);
  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState<Record<number, { name: string; hole_start: number; hole_end: number }>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    api
      .get<EventDetail>(`/events/${id}`)
      .then((d) => {
        setEvent(d);
        setDrafts(suggestSegments(d.total_holes));
      })
      .catch((e) => setError(e.message));
  }, [id]);

  function updateDraft(i: number, name: string) {
    setDrafts((prev) => prev.map((d, idx) => (idx === i ? { ...d, name } : d)));
  }

  async function handleCreate() {
    setCreating(true);
    setError(null);
    try {
      const updated = await api.post<EventDetail>(`/events/${id}/segments`, { segments: drafts });
      setEvent(updated);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  }

  function startRename(segId: number, name: string, hole_start: number, hole_end: number) {
    setRenaming((r) => ({ ...r, [segId]: { name, hole_start, hole_end } }));
  }

  async function saveRename(segId: number) {
    const draft = renaming[segId];
    if (!draft) return;
    setSavingId(segId);
    try {
      const updated = await api.put<EventDetail>(`/segments/${segId}`, draft);
      setEvent(updated);
      setRenaming((r) => {
        const next = { ...r };
        delete next[segId];
        return next;
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(segId: number) {
    if (!confirm('Delete this segment? This also removes its foursomes and scores.')) return;
    const updated = await api.delete<EventDetail>(`/segments/${segId}`);
    setEvent(updated);
  }

  if (error && !event) return <ErrorState message={error} />;
  if (!event) return <LoadingState />;

  return (
    <div className="space-y-8">
      <WizardHeader event={event} eventId={id!} onEventUpdated={setEvent} />

      <section className="space-y-4">
        <h2 className="font-display text-lg font-bold text-green-800">Segments</h2>

        {error && <ErrorState message={error} />}

        {event.segments.length === 0 ? (
          <Card className="space-y-4">
            <p className="text-sm text-green-700">
              We've auto-suggested segments based on {event.total_holes} holes. Rename them if you like, then create them.
            </p>
            <div className="space-y-3">
              {drafts.map((d, i) => (
                <div key={i} className="flex items-center gap-3">
                  <input
                    value={d.name}
                    onChange={(e) => updateDraft(i, e.target.value)}
                    className="flex-1 rounded-lg border-2 border-green-200 px-3 py-2"
                  />
                  <span className="text-sm text-green-500 whitespace-nowrap">
                    Holes {d.hole_start}&ndash;{d.hole_end}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="rounded-full bg-green-600 px-6 py-2 font-bold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Segments'}
            </button>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {event.segments.map((seg) => {
              const draft = renaming[seg.id];
              return (
                <Card key={seg.id}>
                  {draft ? (
                    <div className="space-y-3">
                      <input
                        value={draft.name}
                        onChange={(e) => setRenaming((r) => ({ ...r, [seg.id]: { ...draft, name: e.target.value } }))}
                        className="w-full rounded-lg border-2 border-green-200 px-3 py-2"
                      />
                      <div className="flex gap-3">
                        <input
                          type="number"
                          value={draft.hole_start}
                          onChange={(e) =>
                            setRenaming((r) => ({ ...r, [seg.id]: { ...draft, hole_start: Number(e.target.value) } }))
                          }
                          className="w-20 rounded-lg border-2 border-green-200 px-2 py-1"
                        />
                        <span className="self-center text-green-500">to</span>
                        <input
                          type="number"
                          value={draft.hole_end}
                          onChange={(e) =>
                            setRenaming((r) => ({ ...r, [seg.id]: { ...draft, hole_end: Number(e.target.value) } }))
                          }
                          className="w-20 rounded-lg border-2 border-green-200 px-2 py-1"
                        />
                      </div>
                      <div className="flex gap-3 text-sm font-bold">
                        <button
                          onClick={() => saveRename(seg.id)}
                          disabled={savingId === seg.id}
                          className="text-green-700 hover:underline"
                        >
                          Save
                        </button>
                        <button
                          onClick={() =>
                            setRenaming((r) => {
                              const next = { ...r };
                              delete next[seg.id];
                              return next;
                            })
                          }
                          className="text-gray-500 hover:underline"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-display font-bold text-green-900">{seg.name}</p>
                        <p className="text-sm text-green-500">
                          Holes {seg.hole_start}&ndash;{seg.hole_end} &middot; {seg.foursomes.length} foursome
                          {seg.foursomes.length === 1 ? '' : 's'}
                        </p>
                      </div>
                      <div className="flex gap-3 text-sm font-bold">
                        <button
                          onClick={() => startRename(seg.id, seg.name, seg.hole_start, seg.hole_end)}
                          className="text-green-700 hover:underline"
                        >
                          Edit
                        </button>
                        <button onClick={() => handleDelete(seg.id)} className="text-rose-600 hover:underline">
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
