import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { EventSummary } from '../types';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { LoadingState, ErrorState } from '../components/LoadingState';

export default function Schedule() {
  const [events, setEvents] = useState<EventSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<EventSummary[]>('/events')
      .then(setEvents)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <ErrorState message={error} />;
  if (!events) return <LoadingState />;

  const upcoming = events.filter((e) => e.status !== 'completed').sort((a, b) => a.date.localeCompare(b.date));
  const completed = events.filter((e) => e.status === 'completed').sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-10">
      <h1 className="font-display text-3xl font-bold text-green-800">Season Schedule</h1>

      <section>
        <h2 className="font-display text-xl font-bold text-green-800 mb-4">Upcoming Events</h2>
        {upcoming.length === 0 ? (
          <EmptyState title="Nothing on the calendar yet" subtitle="The admin hasn't scheduled the next event." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {upcoming.map((e) => (
              <Card key={e.id} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-orange-500">
                    {e.status === 'in_progress' ? 'In Progress' : 'Upcoming'}
                  </p>
                  <h3 className="font-display text-lg font-bold text-green-900">{e.name}</h3>
                  <p className="text-sm text-green-600">
                    {e.date} &middot; {e.course_name}
                  </p>
                </div>
                <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-700">
                  {e.total_holes} holes
                </span>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl font-bold text-green-800 mb-4">Completed Events</h2>
        {completed.length === 0 ? (
          <EmptyState title="No completed events yet" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {completed.map((e) => (
              <Card key={e.id}>
                <p className="text-xs font-bold uppercase tracking-wide text-green-500">{e.date}</p>
                <h3 className="font-display text-lg font-bold text-green-900">{e.name}</h3>
                <p className="text-sm text-green-600">{e.course_name}</p>
                {e.winner && (
                  <p className="mt-3 text-sm font-bold text-orange-500">
                    🏆 Winner: {e.winner.name} {e.winner.nickname && `"${e.winner.nickname}"`}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
