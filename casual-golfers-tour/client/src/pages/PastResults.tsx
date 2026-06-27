import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { EventDetail, EventSummary } from '../types';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { LoadingState, ErrorState } from '../components/LoadingState';
import { EventDetailView } from '../components/EventDetailView';

export default function PastResults() {
  const [events, setEvents] = useState<EventSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [details, setDetails] = useState<Record<number, EventDetail>>({});

  useEffect(() => {
    api
      .get<EventSummary[]>('/events')
      .then(setEvents)
      .catch((e) => setError(e.message));
  }, []);

  async function toggle(id: number) {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    setExpanded(id);
    if (!details[id]) {
      const detail = await api.get<EventDetail>(`/events/${id}`);
      setDetails((d) => ({ ...d, [id]: detail }));
    }
  }

  if (error) return <ErrorState message={error} />;
  if (!events) return <LoadingState />;

  const completed = events.filter((e) => e.status === 'completed').sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-green-800">Past Results</h1>

      {completed.length === 0 && (
        <EmptyState title="No results yet" subtitle="Completed events will show up here with full segment-by-segment breakdowns." />
      )}

      <div className="space-y-4">
        {completed.map((e) => (
          <Card key={e.id} className="p-0 overflow-hidden">
            <button
              onClick={() => toggle(e.id)}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-green-50"
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-green-500">{e.date}</p>
                <p className="font-display text-lg font-bold text-green-900">{e.name}</p>
                <p className="text-sm text-green-600">{e.course_name}</p>
              </div>
              <span className="text-2xl text-green-600">{expanded === e.id ? '▲' : '▼'}</span>
            </button>
            {expanded === e.id && (
              <div className="border-t border-green-100 px-5 py-5">
                {details[e.id] ? <EventDetailView event={details[e.id]} /> : <LoadingState label="Loading round details..." />}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
