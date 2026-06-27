const express = require('express');
const db = require('../db/db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const settings = db.prepare('SELECT * FROM season_settings WHERE id = 1').get() || { year: new Date().getFullYear() };
  const players = db.prepare('SELECT id, name, nickname, team FROM players ORDER BY name').all();
  res.json({ year: settings.year, players });
});

router.put('/', requireAdmin, (req, res) => {
  const { year, rosters } = req.body || {};

  const run = db.transaction(() => {
    if (year) {
      db.prepare('INSERT OR REPLACE INTO season_settings (id, year) VALUES (1, ?)').run(Number(year));
    }
    if (Array.isArray(rosters)) {
      const updateTeam = db.prepare('UPDATE players SET team = ? WHERE id = ?');
      for (const { player_id, team } of rosters) {
        if (team && !['A', 'B'].includes(team)) continue;
        updateTeam.run(team || null, player_id);
      }
    }
  });
  run();

  const settings = db.prepare('SELECT * FROM season_settings WHERE id = 1').get();
  const players = db.prepare('SELECT id, name, nickname, team FROM players ORDER BY name').all();
  res.json({ year: settings.year, players });
});

module.exports = router;
