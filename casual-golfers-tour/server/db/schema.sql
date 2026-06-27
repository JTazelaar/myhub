-- Casual Golfers Tour schema

CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  nickname TEXT,
  handicap REAL NOT NULL DEFAULT 0,
  team TEXT CHECK(team IN ('A', 'B'))
);

CREATE TABLE IF NOT EXISTS season_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  year INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  course_name TEXT,
  total_holes INTEGER NOT NULL CHECK (total_holes IN (18, 36)),
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'completed')),
  handicaps_enabled INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS segments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  hole_start INTEGER NOT NULL,
  hole_end INTEGER NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS foursomes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  segment_id INTEGER NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('scramble', 'best_ball', 'alternate_shot', 'one_v_one'))
);

-- partner_player_id: for best_ball / one_v_one formats, the opposing player
-- (on the other team) this player is matched against within the foursome.
-- Null for scramble / alternate_shot, which have no individual matchups.
CREATE TABLE IF NOT EXISTS foursome_players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  foursome_id INTEGER NOT NULL REFERENCES foursomes(id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL REFERENCES players(id),
  team TEXT NOT NULL CHECK (team IN ('A', 'B')),
  partner_player_id INTEGER REFERENCES players(id)
);

-- player_id is null for scramble / alternate_shot (one row per foursome).
-- best_ball / one_v_one have one row per player (4 rows per foursome).
CREATE TABLE IF NOT EXISTS scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  foursome_id INTEGER NOT NULL REFERENCES foursomes(id) ON DELETE CASCADE,
  player_id INTEGER REFERENCES players(id),
  gross_score INTEGER,
  net_score REAL
);

CREATE TABLE IF NOT EXISTS event_points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL REFERENCES players(id),
  points REAL NOT NULL DEFAULT 0,
  placement INTEGER,
  notes TEXT,
  UNIQUE(event_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_segments_event ON segments(event_id);
CREATE INDEX IF NOT EXISTS idx_foursomes_segment ON foursomes(segment_id);
CREATE INDEX IF NOT EXISTS idx_foursome_players_foursome ON foursome_players(foursome_id);
CREATE INDEX IF NOT EXISTS idx_scores_foursome ON scores(foursome_id);
CREATE INDEX IF NOT EXISTS idx_event_points_event ON event_points(event_id);
