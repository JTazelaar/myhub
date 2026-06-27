import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { Card } from '../components/Card';
import { TeamBadge } from '../components/TeamBadge';
import { FormatBadge } from '../components/FormatBadge';
import { LoadingState, ErrorState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import type { Format, Team } from '../types';

interface PlayerProfileSegment {
  segment_id: number;
  segment_name: string;
  foursome_id: number;
  foursome_name: string;
  format: Format;
  matchup_name: string | null;
  gross_score: number | null;
  net_score: number | null;
}

interface PlayerProfileEvent {
  event_id: number;
  event_name: string;
  date: string;
  course_name: string | null;
  status: string;
  placement: number | null;
  points: number;
  notes: string | null;
  team: Team | null;
  segments: PlayerProfileSegment[];
}

interface PlayerProfileData {
  id: number;
  name: string;
  nickname: string | null;
  handicap: number;
  team: Team | null;
  total_points: number;
  events_played: number;
  events: PlayerProfileEvent[];
}

export default function PlayerProfile() {
  const { id } = useParams();
  const [data, setData] = useState<PlayerProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    api
      .get<PlayerProfileData>(`/players/${id}`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState />;

  return (
    <div className="space-y-8">
      <Card className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-green-900">{data.name}</h1>
          {data.nickname && <p className="italic text-green-500">"{data.nickname}"</p>}
          <p className="mt-2 text-sm text-green-700">Handicap: {data.handicap}</p>
          <div className="mt-2">
            <TeamBadge team={data.team} />
          </div>
        </div>
        <div className="flex gap-6 text-center">
          <div>
            <p className="font-display text-3xl font-bold text-orange-500">{data.total_points}</p>
            <p className="text-xs uppercase font-bold text-green-600">Total Points</p>
          </div>
          <div>
            <p className="font-display text-3xl font-bold text-green-700">{data.events_played}</p>
            <p className="text-xs uppercase font-bold text-green-600">Events Played</p>
          </div>
        </div>
      </Card>

      <section>
        <h2 className="font-display text-xl font-bold text-green-800 mb-4">Event History</h2>
        {data.events.length === 0 ? (
          <EmptyState title="No events played yet" subtitle="Once results are recorded, they'll show up here." />
        ) : (
          <div className="space-y-4">
            {data.events.map((e) => (
              <Card key={e.event_id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-green-500">{e.date}</p>
                    <Link to="/results" className="font-display text-lg font-bold text-green-900 hover:underline">
                      {e.event_name}
                    </Link>
                    <p className="text-sm text-green-600">{e.course_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-2xl font-bold text-orange-500">{e.points} pts</p>
                    <p className="text-sm text-green-700">Placement: #{e.placement ?? '—'}</p>
                    {e.team && <TeamBadge team={e.team} />}
                  </div>
                </div>
                {e.notes && <p className="mt-2 text-sm italic text-green-600">"{e.notes}"</p>}

                {e.segments.length > 0 && (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {e.segments.map((s) => (
                      <div key={s.foursome_id} className="rounded-lg bg-green-50 px-3 py-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-green-800">{s.segment_name}</span>
                          <FormatBadge format={s.format} />
                        </div>
                        {s.matchup_name && <p className="text-green-600">vs {s.matchup_name}</p>}
                        <p className="text-green-700">
                          Score: {s.gross_score ?? '—'}
                          {s.net_score !== null && s.net_score !== undefined && ` (net ${s.net_score})`}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
