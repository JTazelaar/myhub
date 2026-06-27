const db = require('../db/db');
const { summarizeFoursome } = require('./golfMath');

const foursomesBySegmentStmt = db.prepare('SELECT * FROM foursomes WHERE segment_id = ? ORDER BY id');
const playersByFoursomeStmt = db.prepare(`
  SELECT fp.id, fp.player_id, fp.team, fp.partner_player_id, p.name, p.nickname, p.handicap
  FROM foursome_players fp
  JOIN players p ON p.id = fp.player_id
  WHERE fp.foursome_id = ?
  ORDER BY fp.team, fp.id
`);
const scoresByFoursomeStmt = db.prepare(`
  SELECT s.id, s.player_id, s.gross_score, s.net_score, p.name AS player_name, p.nickname AS player_nickname
  FROM scores s
  LEFT JOIN players p ON p.id = s.player_id
  WHERE s.foursome_id = ?
`);
const segmentsByEventStmt = db.prepare('SELECT * FROM segments WHERE event_id = ? ORDER BY sort_order, id');
const pointsByEventStmt = db.prepare(`
  SELECT ep.id, ep.player_id, ep.points, ep.placement, ep.notes, p.name AS player_name, p.nickname AS player_nickname
  FROM event_points ep
  JOIN players p ON p.id = ep.player_id
  WHERE ep.event_id = ?
  ORDER BY ep.placement ASC
`);

function getEventDetail(eventId) {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);
  if (!event) return null;

  const segments = segmentsByEventStmt.all(eventId).map((segment) => {
    const foursomes = foursomesBySegmentStmt.all(segment.id).map((foursome) => {
      const players = playersByFoursomeStmt.all(foursome.id);
      const scores = scoresByFoursomeStmt.all(foursome.id);
      const summary = summarizeFoursome(foursome.format, players, scores);
      return { ...foursome, players, scores, summary };
    });
    return { ...segment, foursomes };
  });

  const points = pointsByEventStmt.all(eventId);

  return { ...event, handicaps_enabled: !!event.handicaps_enabled, segments, points };
}

module.exports = { getEventDetail };
