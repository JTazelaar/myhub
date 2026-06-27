const express = require('express');
const db = require('../db/db');
const { requireAdmin } = require('../middleware/auth');
const { getEventDetail } = require('../utils/eventDetail');
const { individualNet, groupNet } = require('../utils/golfMath');

const router = express.Router();

const FORMATS = ['scramble', 'best_ball', 'alternate_shot', 'one_v_one'];

function validatePairs(pairs) {
  if (!Array.isArray(pairs) || pairs.length !== 2) return 'Exactly 2 pairs (4 players) are required';
  for (const p of pairs) {
    if (!p.team_a_player_id || !p.team_b_player_id) {
      return 'Each pair needs one Team A player and one Team B player';
    }
  }
  const ids = pairs.flatMap((p) => [p.team_a_player_id, p.team_b_player_id]);
  if (new Set(ids).size !== 4) return 'All 4 players in a foursome must be different';
  return null;
}

function getSegmentOrFail(segmentId, res) {
  const segment = db.prepare('SELECT * FROM segments WHERE id = ?').get(segmentId);
  if (!segment) {
    res.status(404).json({ error: 'Segment not found' });
    return null;
  }
  return segment;
}

router.post('/', requireAdmin, (req, res) => {
  const { segment_id, name, format, pairs } = req.body || {};
  const segment = getSegmentOrFail(segment_id, res);
  if (!segment) return;

  if (!FORMATS.includes(format)) return res.status(400).json({ error: 'Invalid format' });
  const pairError = validatePairs(pairs);
  if (pairError) return res.status(400).json({ error: pairError });

  const isIndividualMatchup = format === 'best_ball' || format === 'one_v_one';

  db.transaction(() => {
    const { lastInsertRowid: foursomeId } = db
      .prepare('INSERT INTO foursomes (segment_id, name, format) VALUES (?, ?, ?)')
      .run(segment_id, name?.trim() || 'Foursome', format);

    const insertFP = db.prepare(
      'INSERT INTO foursome_players (foursome_id, player_id, team, partner_player_id) VALUES (?, ?, ?, ?)'
    );
    for (const pair of pairs) {
      insertFP.run(foursomeId, pair.team_a_player_id, 'A', isIndividualMatchup ? pair.team_b_player_id : null);
      insertFP.run(foursomeId, pair.team_b_player_id, 'B', isIndividualMatchup ? pair.team_a_player_id : null);
    }
  })();

  res.status(201).json(getEventDetail(segment.event_id));
});

router.put('/:id', requireAdmin, (req, res) => {
  const foursome = db.prepare('SELECT * FROM foursomes WHERE id = ?').get(req.params.id);
  if (!foursome) return res.status(404).json({ error: 'Foursome not found' });
  const segment = db.prepare('SELECT * FROM segments WHERE id = ?').get(foursome.segment_id);

  const { name, format, pairs } = req.body || {};
  const finalFormat = format || foursome.format;
  if (!FORMATS.includes(finalFormat)) return res.status(400).json({ error: 'Invalid format' });

  if (pairs !== undefined) {
    const pairError = validatePairs(pairs);
    if (pairError) return res.status(400).json({ error: pairError });
  }

  db.transaction(() => {
    db.prepare('UPDATE foursomes SET name = ?, format = ? WHERE id = ?').run(
      name?.trim() || foursome.name,
      finalFormat,
      foursome.id
    );

    if (pairs !== undefined) {
      const isIndividualMatchup = finalFormat === 'best_ball' || finalFormat === 'one_v_one';
      db.prepare('DELETE FROM foursome_players WHERE foursome_id = ?').run(foursome.id);
      db.prepare('DELETE FROM scores WHERE foursome_id = ?').run(foursome.id);

      const insertFP = db.prepare(
        'INSERT INTO foursome_players (foursome_id, player_id, team, partner_player_id) VALUES (?, ?, ?, ?)'
      );
      for (const pair of pairs) {
        insertFP.run(foursome.id, pair.team_a_player_id, 'A', isIndividualMatchup ? pair.team_b_player_id : null);
        insertFP.run(foursome.id, pair.team_b_player_id, 'B', isIndividualMatchup ? pair.team_a_player_id : null);
      }
    }
  })();

  res.json(getEventDetail(segment.event_id));
});

router.delete('/:id', requireAdmin, (req, res) => {
  const foursome = db.prepare('SELECT * FROM foursomes WHERE id = ?').get(req.params.id);
  if (!foursome) return res.status(404).json({ error: 'Foursome not found' });
  const segment = db.prepare('SELECT * FROM segments WHERE id = ?').get(foursome.segment_id);
  db.prepare('DELETE FROM foursomes WHERE id = ?').run(foursome.id);
  res.json(getEventDetail(segment.event_id));
});

router.put('/:id/scores', requireAdmin, (req, res) => {
  const foursome = db.prepare('SELECT * FROM foursomes WHERE id = ?').get(req.params.id);
  if (!foursome) return res.status(404).json({ error: 'Foursome not found' });
  const segment = db.prepare('SELECT * FROM segments WHERE id = ?').get(foursome.segment_id);
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(segment.event_id);

  const isGroupFormat = foursome.format === 'scramble' || foursome.format === 'alternate_shot';

  let validationError = null;

  db.transaction(() => {
    db.prepare('DELETE FROM scores WHERE foursome_id = ?').run(foursome.id);

    if (isGroupFormat) {
      const { gross_score } = req.body || {};
      if (gross_score !== null && gross_score !== undefined && gross_score !== '') {
        const handicaps = db
          .prepare(
            'SELECT p.handicap FROM foursome_players fp JOIN players p ON p.id = fp.player_id WHERE fp.foursome_id = ?'
          )
          .all(foursome.id)
          .map((r) => r.handicap);
        const net = event.handicaps_enabled ? groupNet(Number(gross_score), handicaps) : null;
        db.prepare('INSERT INTO scores (foursome_id, player_id, gross_score, net_score) VALUES (?, NULL, ?, ?)').run(
          foursome.id,
          Number(gross_score),
          net
        );
      }
    } else {
      const { scores } = req.body || {};
      if (!Array.isArray(scores)) {
        validationError = 'scores must be an array';
        return;
      }
      const handicapStmt = db.prepare('SELECT handicap FROM players WHERE id = ?');
      const insertScore = db.prepare(
        'INSERT INTO scores (foursome_id, player_id, gross_score, net_score) VALUES (?, ?, ?, ?)'
      );
      for (const s of scores) {
        if (s.gross_score === null || s.gross_score === undefined || s.gross_score === '') continue;
        const handicap = handicapStmt.get(s.player_id)?.handicap || 0;
        const net = event.handicaps_enabled ? individualNet(Number(s.gross_score), handicap) : null;
        insertScore.run(foursome.id, s.player_id, Number(s.gross_score), net);
      }
    }

    if (event.status === 'upcoming') {
      db.prepare("UPDATE events SET status = 'in_progress' WHERE id = ?").run(event.id);
    }
  })();

  if (validationError) return res.status(400).json({ error: validationError });

  res.json(getEventDetail(event.id));
});

module.exports = router;
