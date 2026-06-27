import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../../api/client';
import type { SeasonSettings, Team } from '../../types';
import { Card } from '../../components/Card';
import { LoadingState, ErrorState } from '../../components/LoadingState';

export default function AdminSeason() {
  const [data, setData] = useState<SeasonSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState('');
  const [rosters, setRosters] = useState<Record<number, Team | ''>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api
      .get<SeasonSettings>('/season')
      .then((d) => {
        setData(d);
        setYear(String(d.year));
        setRosters(Object.fromEntries(d.players.map((p) => [p.id, p.team ?? ''])));
      })
      .catch((e) => setError(e.message));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const result = await api.put<SeasonSettings>('/season', {
        year: Number(year),
        rosters: Object.entries(rosters).map(([player_id, team]) => ({
          player_id: Number(player_id),
          team: team || null
        }))
      });
      setData(result);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState />;

  const teamACount = Object.values(rosters).filter((t) => t === 'A').length;
  const teamBCount = Object.values(rosters).filter((t) => t === 'B').length;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-green-900">Season Settings</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <label className="flex flex-col gap-1 text-sm font-bold text-green-800 max-w-xs">
            Season Year
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="rounded-lg border-2 border-green-200 px-3 py-2 font-normal"
            />
          </label>
        </Card>

        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg font-bold text-green-800">Team Rosters</h2>
            <p className="text-sm text-green-600">
              Team A: <span className="font-bold">{teamACount}</span> &middot; Team B:{' '}
              <span className="font-bold">{teamBCount}</span>
            </p>
          </div>
          <div className="divide-y divide-green-50">
            {data.players.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span className="font-bold text-green-900">
                  {p.name}
                  {p.nickname && <span className="ml-1 italic text-green-500 font-normal">"{p.nickname}"</span>}
                </span>
                <div className="flex gap-2">
                  {(['A', 'B'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setRosters((r) => ({ ...r, [p.id]: r[p.id] === t ? '' : t }))}
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        rosters[p.id] === t
                          ? t === 'A'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      Team {t}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-green-600 px-6 py-2 font-bold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          {saved && <span className="text-sm font-bold text-green-700">Saved!</span>}
        </div>
      </form>
    </div>
  );
}
