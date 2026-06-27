import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import type { EventStatus, EventSummary } from '../../types';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState, ErrorState } from '../../components/LoadingState';

const STATUS_STYLES: Record<EventStatus, string> = {
  upcoming: 'bg-sky-100 text-sky-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700'
};

const STATUS_LABELS: Record<EventStatus, string> = {
  upcoming: 'Upcoming',
  in_progress: 'In Progress',
  completed: 'Completed'
};

export default function AdminEventsList() {
  const [events, setEvents] = useState<EventSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<EventSummary[]>('/events')
      .then(setEvents)
      .catch((e) => setError(e.message));
  }, []);

  async function handleDelete(e: EventSummary) {
    if (!confirm(`Delete "${e.name}"? This removes all segments, foursomes, scores, and points for this event.`)) return;
    await api.delete(`/events/${e.id}`);
    setEvents((prev) => prev?.filter((ev) => ev.id !== e.id) ?? null);
  }

  if (error) return <ErrorState message={error} />;
  if (!events) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-green-900">Events</h1>
        <Link
          to="/admin/events/new"
          className="rounded-full bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600"
        >
          + New Event
        </Link>
      </div>

      {events.length === 0 ? (
        <EmptyState title="No events yet" subtitle="Create your first event to start building out the season." />
      ) : (
        <div className="space-y-4">
          {events.map((e) => (
            <Card key={e.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-green-500">{e.date}</p>
                  <p className="font-display text-lg font-bold text-green-900">{e.name}</p>
                  <p className="text-sm text-green-600">
                    {e.course_name} &middot; {e.total_holes} holes{e.handicaps_enabled ? ' · Handicaps on' : ''}
                  </p>
                  {e.winner && (
                    <p className="mt-1 text-sm font-bold text-orange-500">
                      🏆 {e.winner.name}
                      {e.winner.nickname ? ` "${e.winner.nickname}"` : ''}
                    </p>
                  )}
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[e.status]}`}>
                  {STATUS_LABELS[e.status]}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-sm font-bold">
                <Link
                  to={`/admin/events/${e.id}/segments`}
                  className="rounded-full bg-green-100 px-3 py-1 text-green-700 hover:bg-green-200"
                >
                  Segments
                </Link>
                <Link
                  to={`/admin/events/${e.id}/foursomes`}
                  className="rounded-full bg-green-100 px-3 py-1 text-green-700 hover:bg-green-200"
                >
                  Foursomes
                </Link>
                <Link
                  to={`/admin/events/${e.id}/scores`}
                  className="rounded-full bg-green-100 px-3 py-1 text-green-700 hover:bg-green-200"
                >
                  Scores
                </Link>
                <Link
                  to={`/admin/events/${e.id}/points`}
                  className="rounded-full bg-green-100 px-3 py-1 text-green-700 hover:bg-green-200"
                >
                  Points
                </Link>
                <button
                  onClick={() => handleDelete(e)}
                  className="rounded-full bg-rose-100 px-3 py-1 text-rose-600 hover:bg-rose-200"
                >
                  Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
