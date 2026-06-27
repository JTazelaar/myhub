const express = require('express');
const db = require('../db/db');

const router = express.Router();

router.get('/', (req, res) => {
  const rows = db
    .prepare(
      `SELECT p.id, p.name, p.nickname, p.handicap, p.team,
              COALESCE(SUM(ep.points), 0) AS total_points,
              COUNT(ep.id) AS events_played
       FROM players p
       LEFT JOIN event_points ep ON ep.player_id = p.id
       GROUP BY p.id
       ORDER BY total_points DESC, p.name ASC`
    )
    .all();

  let rank = 0;
  let lastScore = null;
  const out = rows.map((r, i) => {
    if (r.total_points !== lastScore) {
      rank = i + 1;
      lastScore = r.total_points;
    }
    return { ...r, rank };
  });

  res.json(out);
});

module.exports = router;
