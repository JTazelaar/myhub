const db = require('./db');
const { individualNet, groupNet } = require('../utils/golfMath');

const PLAYERS = [
  { name: 'Mike Donovan', nickname: 'The Shank', handicap: 14.2, team: 'A' },
  { name: 'Chris Patel', nickname: 'Big Easy', handicap: 9.5, team: 'A' },
  { name: 'Dave Lindqvist', nickname: 'Sandman', handicap: 18.0, team: 'A' },
  { name: 'Tony Russo', nickname: 'Tin Cup', handicap: 11.3, team: 'A' },
  { name: 'Greg Holloway', nickname: 'Slice', handicap: 22.4, team: 'A' },
  { name: 'Brian Yamamoto', nickname: 'Birdie Brian', handicap: 6.8, team: 'A' },
  { name: 'Steve Marchetti', nickname: 'Mulligan', handicap: 16.5, team: 'B' },
  { name: 'Paul Whitfield', nickname: 'The Wedge', handicap: 13.0, team: 'B' },
  { name: 'Andy Castellano', nickname: 'Chip Shot', handicap: 19.7, team: 'B' },
  { name: 'Jake Sorensen', nickname: 'Lightning', handicap: 8.1, team: 'B' },
  { name: 'Rick Beaumont', nickname: 'Putts McGee', handicap: 24.0, team: 'B' },
  { name: 'Marcus Webb', nickname: 'The Eagle', handicap: 4.5, team: 'B' }
];

function seed() {
  const playerCount = db.prepare('SELECT COUNT(*) AS n FROM players').get().n;
  if (playerCount > 0) {
    console.log('Database already has data, skipping seed.');
    return;
  }

  const insertPlayer = db.prepare(
    'INSERT INTO players (name, nickname, handicap, team) VALUES (?, ?, ?, ?)'
  );
  const insertEvent = db.prepare(
    `INSERT INTO events (name, date, course_name, total_holes, status, handicaps_enabled)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const insertSegment = db.prepare(
    `INSERT INTO segments (event_id, name, hole_start, hole_end, sort_order)
     VALUES (?, ?, ?, ?, ?)`
  );
  const insertFoursome = db.prepare(
    'INSERT INTO foursomes (segment_id, name, format) VALUES (?, ?, ?)'
  );
  const insertFoursomePlayer = db.prepare(
    `INSERT INTO foursome_players (foursome_id, player_id, team, partner_player_id)
     VALUES (?, ?, ?, ?)`
  );
  const insertScore = db.prepare(
    `INSERT INTO scores (foursome_id, player_id, gross_score, net_score)
     VALUES (?, ?, ?, ?)`
  );
  const insertPoints = db.prepare(
    `INSERT INTO event_points (event_id, player_id, points, placement, notes)
     VALUES (?, ?, ?, ?, ?)`
  );

  const run = db.transaction(() => {
    db.prepare('INSERT OR REPLACE INTO season_settings (id, year) VALUES (1, ?)').run(2026);

    const playerIds = {};
    for (const p of PLAYERS) {
      const { lastInsertRowid } = insertPlayer.run(p.name, p.nickname, p.handicap, p.team);
      playerIds[p.name] = lastInsertRowid;
    }
    const id = (name) => playerIds[name];
    const hcp = (name) => PLAYERS.find((p) => p.name === name).handicap;

    // --- Completed event: Masters of Mediocrity Invitational ---
    const eventId = insertEvent.run(
      'Masters of Mediocrity Invitational',
      '2026-04-18',
      'Pebble Creek Golf Club',
      18,
      'completed',
      1
    ).lastInsertRowid;

    const front9 = insertSegment.run(eventId, 'Front 9', 1, 9, 1).lastInsertRowid;
    const back9 = insertSegment.run(eventId, 'Back 9', 10, 18, 2).lastInsertRowid;

    function buildFoursome(segmentId, name, format, pairs) {
      // pairs: [{ teamAPlayer, teamBPlayer }] where teamA/teamB players are matched up
      const foursomeId = insertFoursome.run(segmentId, name, format).lastInsertRowid;
      for (const { teamAPlayer, teamBPlayer } of pairs) {
        insertFoursomePlayer.run(foursomeId, id(teamAPlayer), 'A', format === 'scramble' || format === 'alternate_shot' ? null : id(teamBPlayer));
        insertFoursomePlayer.run(foursomeId, id(teamBPlayer), 'B', format === 'scramble' || format === 'alternate_shot' ? null : id(teamAPlayer));
      }
      return foursomeId;
    }

    function saveGroupScore(foursomeId, gross, handicaps) {
      insertScore.run(foursomeId, null, gross, groupNet(gross, handicaps));
    }

    function saveIndividualScore(foursomeId, playerName, gross) {
      insertScore.run(foursomeId, id(playerName), gross, individualNet(gross, hcp(playerName)));
    }

    // Front 9 — Foursome 1: Scramble — Mike & Chris (A) vs Steve & Paul (B)
    const f1 = buildFoursome(front9, 'Foursome 1', 'scramble', [
      { teamAPlayer: 'Mike Donovan', teamBPlayer: 'Steve Marchetti' },
      { teamAPlayer: 'Chris Patel', teamBPlayer: 'Paul Whitfield' }
    ]);
    saveGroupScore(f1, 36, [hcp('Mike Donovan'), hcp('Chris Patel'), hcp('Steve Marchetti'), hcp('Paul Whitfield')]);

    // Front 9 — Foursome 2: Best Ball — Dave & Tony (A) vs Andy & Jake (B)
    const f2 = buildFoursome(front9, 'Foursome 2', 'best_ball', [
      { teamAPlayer: 'Dave Lindqvist', teamBPlayer: 'Andy Castellano' },
      { teamAPlayer: 'Tony Russo', teamBPlayer: 'Jake Sorensen' }
    ]);
    saveIndividualScore(f2, 'Dave Lindqvist', 46);
    saveIndividualScore(f2, 'Tony Russo', 42);
    saveIndividualScore(f2, 'Andy Castellano', 48);
    saveIndividualScore(f2, 'Jake Sorensen', 39);

    // Front 9 — Foursome 3: 1v1 Stroke Play — Greg & Brian (A) vs Rick & Marcus (B)
    const f3 = buildFoursome(front9, 'Foursome 3', 'one_v_one', [
      { teamAPlayer: 'Greg Holloway', teamBPlayer: 'Rick Beaumont' },
      { teamAPlayer: 'Brian Yamamoto', teamBPlayer: 'Marcus Webb' }
    ]);
    saveIndividualScore(f3, 'Greg Holloway', 50);
    saveIndividualScore(f3, 'Rick Beaumont', 51);
    saveIndividualScore(f3, 'Brian Yamamoto', 40);
    saveIndividualScore(f3, 'Marcus Webb', 38);

    // Back 9 — pairings shuffle. Foursome 1: Alternate Shot — Mike & Dave (A) vs Andy & Rick (B)
    const f4 = buildFoursome(back9, 'Foursome 1', 'alternate_shot', [
      { teamAPlayer: 'Mike Donovan', teamBPlayer: 'Andy Castellano' },
      { teamAPlayer: 'Dave Lindqvist', teamBPlayer: 'Rick Beaumont' }
    ]);
    saveGroupScore(f4, 42, [hcp('Mike Donovan'), hcp('Dave Lindqvist'), hcp('Andy Castellano'), hcp('Rick Beaumont')]);

    // Back 9 — Foursome 2: 1v1 Stroke Play — Chris & Greg (A) vs Steve & Marcus (B)
    const f5 = buildFoursome(back9, 'Foursome 2', 'one_v_one', [
      { teamAPlayer: 'Chris Patel', teamBPlayer: 'Steve Marchetti' },
      { teamAPlayer: 'Greg Holloway', teamBPlayer: 'Marcus Webb' }
    ]);
    saveIndividualScore(f5, 'Chris Patel', 40);
    saveIndividualScore(f5, 'Steve Marchetti', 44);
    saveIndividualScore(f5, 'Greg Holloway', 49);
    saveIndividualScore(f5, 'Marcus Webb', 37);

    // Back 9 — Foursome 3: Best Ball — Tony & Brian (A) vs Paul & Jake (B)
    const f6 = buildFoursome(back9, 'Foursome 3', 'best_ball', [
      { teamAPlayer: 'Tony Russo', teamBPlayer: 'Paul Whitfield' },
      { teamAPlayer: 'Brian Yamamoto', teamBPlayer: 'Jake Sorensen' }
    ]);
    saveIndividualScore(f6, 'Tony Russo', 41);
    saveIndividualScore(f6, 'Brian Yamamoto', 38);
    saveIndividualScore(f6, 'Paul Whitfield', 43);
    saveIndividualScore(f6, 'Jake Sorensen', 37);

    // Final points for Masters of Mediocrity Invitational
    const finalPoints = [
      ['Marcus Webb', 1, 24, 'Eagle on 14 sealed it'],
      ['Jake Sorensen', 2, 22, ''],
      ['Brian Yamamoto', 3, 20, ''],
      ['Chris Patel', 4, 18, ''],
      ['Tony Russo', 5, 16, ''],
      ['Mike Donovan', 6, 14, ''],
      ['Paul Whitfield', 7, 12, ''],
      ['Steve Marchetti', 8, 10, ''],
      ['Dave Lindqvist', 9, 8, ''],
      ['Andy Castellano', 10, 6, ''],
      ['Greg Holloway', 11, 4, 'Lost 3 balls in the lake on 7'],
      ['Rick Beaumont', 12, 2, 'Forgot his putter, used a 7-iron all day']
    ];
    for (const [name, placement, points, notes] of finalPoints) {
      insertPoints.run(eventId, id(name), points, placement, notes);
    }

    // --- Upcoming event, not yet built out ---
    insertEvent.run('Bunker Bash Classic', '2026-08-15', 'Eagle Ridge Golf Club', 36, 'upcoming', 1);
  });

  run();
  console.log('Seed complete: 12 players, 1 completed event, 1 upcoming event.');
}

if (require.main === module) {
  seed();
}

module.exports = seed;
