const express = require('express');
const db = require('../db/db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

function getPlayerProfile(playerId) {
  const player = db.prepare('SELECT * FROM players WHERE id = ?').get(playerId);
  if (!player) return null;

  const pointsRows = db
    .prepare(
      `SELECT ep.*, e.name AS event_name, e.date, e.course_name, e.status
       FROM event_points ep
       JOIN events e ON e.id = ep.event_id
       WHERE ep.player_id = ?
       ORDER BY e.date DESC`
    )
    .all(playerId);

  const totalPoints = pointsRows.reduce((sum, r) => sum + r.points, 0);

  const foursomesForEventStmt = db.prepare(
    `SELECT fp.team, fp.partner_player_id, f.id AS foursome_id, f.name AS foursome_name, f.format,
            seg.id AS segment_id, seg.name AS segment_name
     FROM foursome_players fp
     JOIN foursomes f ON f.id = fp.foursome_id
     JOIN segments seg ON seg.id = f.segment_id
     WHERE fp.player_id = ? AND seg.event_id = ?
     ORDER BY seg.sort_order`
  );
  const scoreStmt = db.prepare(
    'SELECT gross_score, net_score FROM scores WHERE foursome_id = ? AND (player_id = ? OR player_id IS NULL)'
  );
  const playerNameStmt = db.prepare('SELECT name FROM players WHERE id = ?');

  const events = pointsRows.map((row) => {
    const foursomeRows = foursomesForEventStmt.all(playerId, row.event_id);
    const team = foursomeRows.length > 0 ? foursomeRows[0].team : null;

    const segments = foursomeRows.map((fr) => {
      const score = scoreStmt.get(fr.foursome_id, playerId);
      const partner = fr.partner_player_id ? playerNameStmt.get(fr.partner_player_id) : null;
      return {
        segment_id: fr.segment_id,
        segment_name: fr.segment_name,
        foursome_id: fr.foursome_id,
        foursome_name: fr.foursome_name,
        format: fr.format,
        matchup_name: partner ? partner.name : null,
        gross_score: score ? score.gross_score : null,
        net_score: score ? score.net_score : null
      };
    });

    return {
      event_id: row.event_id,
      event_name: row.event_name,
      date: row.date,
      course_name: row.course_name,
      status: row.status,
      placement: row.placement,
      points: row.points,
      notes: row.notes,
      team,
      segments
    };
  });

  return {
    id: player.id,
    name: player.name,
    nickname: player.nickname,
    handicap: player.handicap,
    team: player.team,
    total_points: totalPoints,
    events_played: pointsRows.length,
    events
  };
}

router.get('/', (req, res) => {
  const players = db.prepare('SELECT * FROM players ORDER BY name').all();
  res.json(players);
});

router.get('/:id', (req, res) => {
  const profile = getPlayerProfile(req.params.id);
  if (!profile) return res.status(404).json({ error: 'Player not found' });
  res.json(profile);
});

router.post('/', requireAdmin, (req, res) => {
  const { name, nickname, handicap, team } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
  if (team && !['A', 'B'].includes(team)) return res.status(400).json({ error: 'Team must be A or B' });

  const { lastInsertRowid } = db
    .prepare('INSERT INTO players (name, nickname, handicap, team) VALUES (?, ?, ?, ?)')
    .run(name.trim(), nickname || null, Number(handicap) || 0, team || null);

  res.status(201).json(db.prepare('SELECT * FROM players WHERE id = ?').get(lastInsertRowid));
});

router.put('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM players WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Player not found' });

  const { name, nickname, handicap, team } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
  if (team && !['A', 'B'].includes(team)) return res.status(400).json({ error: 'Team must be A or B' });

  db.prepare('UPDATE players SET name = ?, nickname = ?, handicap = ?, team = ? WHERE id = ?').run(
    name.trim(),
    nickname || null,
    Number(handicap) || 0,
    team || null,
    req.params.id
  );

  res.json(db.prepare('SELECT * FROM players WHERE id = ?').get(req.params.id));
});

router.delete('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM players WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Player not found' });
  db.prepare('DELETE FROM players WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

module.exports = router;
