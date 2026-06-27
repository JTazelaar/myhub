import { useState, type FormEvent } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { api } from '../../../api/client';
import { Card } from '../../../components/Card';
import type { EventDetail, EventStatus } from '../../../types';

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

const TABS = [
  { suffix: 'segments', label: 'Segments' },
  { suffix: 'foursomes', label: 'Foursomes' },
  { suffix: 'scores', label: 'Scores' },
  { suffix: 'points', label: 'Points' }
];

export function WizardHeader({
  event,
  eventId,
  onEventUpdated
}: {
  event: EventDetail;
  eventId: string;
  onEventUpdated: (event: EventDetail) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: event.name,
    date: event.date,
    course_name: event.course_name ?? '',
    total_holes: String(event.total_holes),
    handicaps_enabled: event.handicaps_enabled
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function startEdit() {
    setForm({
      name: event.name,
      date: event.date,
      course_name: event.course_name ?? '',
      total_holes: String(event.total_holes),
      handicaps_enabled: event.handicaps_enabled
    });
    setFormError(null);
    setEditing(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const updated = await api.put<EventDetail>(`/events/${eventId}`, {
        name: form.name,
        date: form.date,
        course_name: form.course_name || null,
        total_holes: Number(form.total_holes),
        handicaps_enabled: form.handicaps_enabled
      });
      onEventUpdated(updated);
      setEditing(false);
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Link to="/admin/events" className="text-sm font-bold text-green-600 hover:underline">
        ← All Events
      </Link>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-green-500">{event.date}</p>
            <h1 className="font-display text-2xl font-bold text-green-900">{event.name}</h1>
            <p className="text-sm text-green-600">
              {event.course_name} &middot; {event.total_holes} holes
              {event.handicaps_enabled ? ' · Handicaps on' : ' · Handicaps off'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[event.status]}`}>
              {STATUS_LABELS[event.status]}
            </span>
            <button
              onClick={() => (editing ? setEditing(false) : startEdit())}
              className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700 hover:bg-green-200"
            >
              {editing ? 'Cancel' : 'Edit Details'}
            </button>
          </div>
        </div>

        {editing && (
          <form onSubmit={handleSubmit} className="mt-4 grid gap-4 border-t border-green-100 pt-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm font-bold text-green-800">
              Event Name
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                <option value="18">18</option>
                <option value="36">36</option>
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

            {formError && <p className="sm:col-span-2 text-sm font-bold text-rose-600">{formError}</p>}

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-green-600 px-5 py-2 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Details'}
              </button>
            </div>
          </form>
        )}
      </Card>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <NavLink
            key={t.suffix}
            to={`/admin/events/${eventId}/${t.suffix}`}
            className={({ isActive }) =>
              `rounded-full px-4 py-2 text-sm font-bold ${
                isActive ? 'bg-green-700 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
