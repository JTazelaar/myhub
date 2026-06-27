const express = require('express');
const db = require('../db/db');
const { requireAdmin } = require('../middleware/auth');
const { getEventDetail } = require('../utils/eventDetail');

const router = express.Router();

router.get('/', (req, res) => {
  const events = db.prepare('SELECT * FROM events ORDER BY date DESC').all();
  const winnerStmt = db.prepare(
    `SELECT p.name, p.nickname FROM event_points ep
     JOIN players p ON p.id = ep.player_id
     WHERE ep.event_id = ? AND ep.placement = 1`
  );

  const out = events.map((e) => {
    const winner = e.status === 'completed' ? winnerStmt.get(e.id) : null;
    return { ...e, handicaps_enabled: !!e.handicaps_enabled, winner: winner || null };
  });
  res.json(out);
});

router.get('/:id', (req, res) => {
  const detail = getEventDetail(req.params.id);
  if (!detail) return res.status(404).json({ error: 'Event not found' });
  res.json(detail);
});

router.post('/', requireAdmin, (req, res) => {
  const { name, date, course_name, total_holes, handicaps_enabled } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: 'Event name is required' });
  if (!date) return res.status(400).json({ error: 'Date is required' });
  if (![18, 36].includes(Number(total_holes))) {
    return res.status(400).json({ error: 'total_holes must be 18 or 36' });
  }

  const { lastInsertRowid } = db
    .prepare(
      `INSERT INTO events (name, date, course_name, total_holes, status, handicaps_enabled)
       VALUES (?, ?, ?, ?, 'upcoming', ?)`
    )
    .run(name.trim(), date, course_name || null, Number(total_holes), handicaps_enabled ? 1 : 0);

  res.status(201).json(getEventDetail(lastInsertRowid));
});

router.put('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Event not found' });

  const { name, date, course_name, total_holes, handicaps_enabled } = req.body || {};
  db.prepare(
    `UPDATE events SET name = ?, date = ?, course_name = ?, total_holes = ?, handicaps_enabled = ?
     WHERE id = ?`
  ).run(
    name?.trim() || existing.name,
    date || existing.date,
    course_name !== undefined ? course_name : existing.course_name,
    total_holes ? Number(total_holes) : existing.total_holes,
    handicaps_enabled !== undefined ? (handicaps_enabled ? 1 : 0) : existing.handicaps_enabled,
    req.params.id
  );

  res.json(getEventDetail(req.params.id));
});

router.delete('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Event not found' });
  db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// Initial segment creation (Step 2). Guarded so it can't silently wipe out
// foursomes by re-running on an event that's already been built out.
router.post('/:id/segments', requireAdmin, (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const existingCount = db.prepare('SELECT COUNT(*) AS n FROM segments WHERE event_id = ?').get(event.id).n;
  if (existingCount > 0) {
    return res.status(409).json({ error: 'Segments already exist for this event. Edit or delete them individually.' });
  }

  const { segments } = req.body || {};
  if (!Array.isArray(segments) || segments.length === 0) {
    return res.status(400).json({ error: 'segments must be a non-empty array' });
  }

  const insert = db.prepare(
    'INSERT INTO segments (event_id, name, hole_start, hole_end, sort_order) VALUES (?, ?, ?, ?, ?)'
  );
  const run = db.transaction(() => {
    segments.forEach((s, i) => {
      insert.run(event.id, s.name, s.hole_start, s.hole_end, i);
    });
  });
  run();

  res.status(201).json(getEventDetail(event.id));
});

// Step 5: final points entry. Marks the event completed.
router.put('/:id/points', requireAdmin, (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const { points } = req.body || {};
  if (!Array.isArray(points) || points.length === 0) {
    return res.status(400).json({ error: 'points must be a non-empty array' });
  }

  const upsert = db.prepare(
    `INSERT INTO event_points (event_id, player_id, points, placement, notes)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(event_id, player_id) DO UPDATE SET points = excluded.points, placement = excluded.placement, notes = excluded.notes`
  );
  const run = db.transaction(() => {
    for (const p of points) {
      upsert.run(event.id, p.player_id, Number(p.points) || 0, p.placement || null, p.notes || null);
    }
    db.prepare("UPDATE events SET status = 'completed' WHERE id = ?").run(event.id);
  });
  run();

  res.json(getEventDetail(event.id));
});

module.exports = router;
