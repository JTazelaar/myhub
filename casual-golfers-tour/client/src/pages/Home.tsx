import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { EventSummary, LeaderboardEntry } from '../types';
import { Card } from '../components/Card';
import { TeamBadge } from '../components/TeamBadge';
import { EmptyState } from '../components/EmptyState';
import { LoadingState, ErrorState } from '../components/LoadingState';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Home() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null);
  const [events, setEvents] = useState<EventSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.get<LeaderboardEntry[]>('/leaderboard'), api.get<EventSummary[]>('/events')])
      .then(([lb, ev]) => {
        setLeaderboard(lb);
        setEvents(ev);
      })
      .catch((e) => setError(e.message));
  }, []);

  const recentCompleted = events?.filter((e) => e.status === 'completed').slice(0, 3) ?? [];

  return (
    <div className="space-y-10">
      <section className="rounded-3xl bg-gradient-to-br from-green-600 to-emerald-500 px-6 py-12 text-center text-white shadow-lg">
        <h1 className="font-display text-4xl sm:text-5xl font-bold drop-shadow-sm">⛳ Casual Golfers Tour</h1>
        <p className="mt-3 text-lg text-green-50">Season {new Date().getFullYear()} &mdash; 12 friends, 6 events, endless trash talk</p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-bold text-green-800 mb-4">Season Leaderboard</h2>
        {error && <ErrorState message={error} />}
        {!error && !leaderboard && <LoadingState label="Tallying points..." />}
        {leaderboard && leaderboard.length === 0 && (
          <EmptyState title="No points yet" subtitle="Once an event is completed and points are entered, the leaderboard will show up here." />
        )}
        {leaderboard && leaderboard.length > 0 && (
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-green-100 text-green-800 text-sm uppercase tracking-wide">
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Player</th>
                  <th className="px-4 py-3">Team</th>
                  <th className="px-4 py-3 text-right">Points</th>
                  <th className="px-4 py-3 text-right">Events</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((p) => (
                  <tr key={p.id} className="border-t border-green-50 hover:bg-green-50">
                    <td className="px-4 py-3 font-display font-bold text-green-700">
                      {MEDALS[p.rank - 1] ?? `#${p.rank}`}
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/players/${p.id}`} className="font-bold text-green-900 hover:underline">
                        {p.name}
                      </Link>
                      {p.nickname && <span className="ml-1 text-green-500 italic">"{p.nickname}"</span>}
                    </td>
                    <td className="px-4 py-3">
                      <TeamBadge team={p.team} />
                    </td>
                    <td className="px-4 py-3 text-right font-display text-lg font-bold text-orange-500">
                      {p.total_points}
                    </td>
                    <td className="px-4 py-3 text-right text-green-700">{p.events_played}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>

      <section>
        <h2 className="font-display text-2xl font-bold text-green-800 mb-4">Recent Results</h2>
        {recentCompleted.length === 0 && events && (
          <EmptyState title="No events played yet" subtitle="Check back after the first round of the season." />
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recentCompleted.map((e) => (
            <Card key={e.id}>
              <p className="text-xs font-bold uppercase tracking-wide text-green-500">{e.date}</p>
              <h3 className="font-display text-lg font-bold text-green-900">{e.name}</h3>
              <p className="text-sm text-green-600">{e.course_name}</p>
              {e.winner && (
                <p className="mt-3 text-sm font-bold text-orange-500">
                  🏆 {e.winner.name} {e.winner.nickname && `"${e.winner.nickname}"`}
                </p>
              )}
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
