const express = require('express');
const db = require('../db/db');
const { requireAdmin } = require('../middleware/auth');
const { getEventDetail } = require('../utils/eventDetail');

const router = express.Router();

router.put('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM segments WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Segment not found' });

  const { name, hole_start, hole_end } = req.body || {};
  db.prepare('UPDATE segments SET name = ?, hole_start = ?, hole_end = ? WHERE id = ?').run(
    name?.trim() || existing.name,
    hole_start ?? existing.hole_start,
    hole_end ?? existing.hole_end,
    req.params.id
  );

  res.json(getEventDetail(existing.event_id));
});

router.delete('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM segments WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Segment not found' });
  db.prepare('DELETE FROM segments WHERE id = ?').run(req.params.id);
  res.json(getEventDetail(existing.event_id));
});

module.exports = router;
