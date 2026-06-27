import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../api/client';
import { Card } from '../../../components/Card';
import type { EventDetail } from '../../../types';

export default function Step1Create() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    date: '',
    course_name: '',
    total_holes: '18',
    handicaps_enabled: true
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const created = await api.post<EventDetail>('/events', {
        name: form.name,
        date: form.date,
        course_name: form.course_name || null,
        total_holes: Number(form.total_holes),
        handicaps_enabled: form.handicaps_enabled
      });
      navigate(`/admin/events/${created.id}/segments`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-green-900">Create Event</h1>
      <Card>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-bold text-green-800 sm:col-span-2">
            Event Name
            <input
              required
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Bunker Bash Classic"
              className="rounded-lg border-2 border-green-200 px-3 py-2 font-normal"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-bold text-green-800">
            Date
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="rounded-lg border-2 border-green-200 px-3 py-2 font-normal"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-bold text-green-800">
            Course Name
            <input
              value={form.course_name}
              onChange={(e) => setForm({ ...form, course_name: e.target.value })}
              className="rounded-lg border-2 border-green-200 px-3 py-2 font-normal"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-bold text-green-800">
            Total Holes
            <select
              value={form.total_holes}
              onChange={(e) => setForm({ ...form, total_holes: e.target.value })}
              className="rounded-lg border-2 border-green-200 px-3 py-2 font-normal"
            >
              <option value="18">18 (one round)</option>
              <option value="36">36 (two rounds)</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm font-bold text-green-800 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.handicaps_enabled}
              onChange={(e) => setForm({ ...form, handicaps_enabled: e.target.checked })}
              className="h-4 w-4"
            />
            Handicaps enabled for this event
          </label>

          {error && <p className="sm:col-span-2 text-sm font-bold text-rose-600">{error}</p>}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-green-600 px-6 py-2 font-bold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create & Continue'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
