import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../../api/client';
import type { Player, Team } from '../../types';
import { Card } from '../../components/Card';
import { TeamBadge } from '../../components/TeamBadge';
import { LoadingState, ErrorState } from '../../components/LoadingState';

interface PlayerFormState {
  id?: number;
  name: string;
  nickname: string;
  handicap: string;
  team: Team | '';
}

const emptyForm: PlayerFormState = { name: '', nickname: '', handicap: '0', team: '' };

export default function AdminPlayers() {
  const [players, setPlayers] = useState<Player[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<PlayerFormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function load() {
    api
      .get<Player[]>('/players')
      .then(setPlayers)
      .catch((e) => setError(e.message));
  }

  useEffect(load, []);

  function startCreate() {
    setForm(emptyForm);
    setFormError(null);
  }

  function startEdit(p: Player) {
    setForm({ id: p.id, name: p.name, nickname: p.nickname ?? '', handicap: String(p.handicap), team: p.team ?? '' });
    setFormError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: form.name,
        nickname: form.nickname || null,
        handicap: Number(form.handicap),
        team: form.team || null
      };
      if (form.id) {
        await api.put(`/players/${form.id}`, payload);
      } else {
        await api.post('/players', payload);
      }
      setForm(null);
      load();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p: Player) {
    if (!confirm(`Remove ${p.name} from the roster? This cannot be undone.`)) return;
    await api.delete(`/players/${p.id}`);
    load();
  }

  if (error) return <ErrorState message={error} />;
  if (!players) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-green-900">Players</h1>
        <button
          onClick={startCreate}
          className="rounded-full bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600"
        >
          + Add Player
        </button>
      </div>

      {form && (
        <Card>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm font-bold text-green-800">
              Name
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="rounded-lg border-2 border-green-200 px-3 py-2 font-normal"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-bold text-green-800">
              Nickname
              <input
                value={form.nickname}
                onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                className="rounded-lg border-2 border-green-200 px-3 py-2 font-normal"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-bold text-green-800">
              Handicap
              <input
                type="number"
                step="0.1"
                value={form.handicap}
                onChange={(e) => setForm({ ...form, handicap: e.target.value })}
                className="rounded-lg border-2 border-green-200 px-3 py-2 font-normal"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-bold text-green-800">
              Team
              <select
                value={form.team}
                onChange={(e) => setForm({ ...form, team: e.target.value as Team | '' })}
                className="rounded-lg border-2 border-green-200 px-3 py-2 font-normal"
              >
                <option value="">Unassigned</option>
                <option value="A">Team A</option>
                <option value="B">Team B</option>
              </select>
            </label>

            {formError && <p className="sm:col-span-2 text-sm font-bold text-rose-600">{formError}</p>}

            <div className="sm:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-green-600 px-5 py-2 font-bold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : form.id ? 'Save Changes' : 'Add Player'}
              </button>
              <button
                type="button"
                onClick={() => setForm(null)}
                className="rounded-full bg-gray-200 px-5 py-2 font-bold text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-green-100 text-green-800 uppercase text-xs">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Handicap</th>
                <th className="px-4 py-3">Team</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p.id} className="border-t border-green-50">
                  <td className="px-4 py-3">
                    <span className="font-bold text-green-900">{p.name}</span>
                    {p.nickname && <span className="ml-1 italic text-green-500">"{p.nickname}"</span>}
                  </td>
                  <td className="px-4 py-3">{p.handicap}</td>
                  <td className="px-4 py-3">
                    <TeamBadge team={p.team} />
                  </td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button onClick={() => startEdit(p)} className="font-bold text-green-700 hover:underline">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(p)} className="font-bold text-rose-600 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
