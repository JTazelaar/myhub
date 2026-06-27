export type Team = 'A' | 'B';
export type EventStatus = 'upcoming' | 'in_progress' | 'completed';
export type Format = 'scramble' | 'best_ball' | 'alternate_shot' | 'one_v_one';

export const FORMAT_LABELS: Record<Format, string> = {
  scramble: 'Scramble',
  best_ball: 'Best Ball',
  alternate_shot: 'Alternate Shot',
  one_v_one: '1v1 Stroke Play'
};

export interface Player {
  id: number;
  name: string;
  nickname: string | null;
  handicap: number;
  team: Team | null;
}

export interface LeaderboardEntry extends Player {
  total_points: number;
  events_played: number;
  rank: number;
}

export interface EventSummary {
  id: number;
  name: string;
  date: string;
  course_name: string | null;
  total_holes: 18 | 36;
  status: EventStatus;
  handicaps_enabled: boolean;
  winner: { name: string; nickname: string | null } | null;
}

export interface FoursomePlayer {
  id: number;
  player_id: number;
  name: string;
  nickname: string | null;
  handicap: number;
  team: Team;
  partner_player_id: number | null;
}

export interface Score {
  id: number;
  player_id: number | null;
  gross_score: number | null;
  net_score: number | null;
  player_name: string | null;
  player_nickname: string | null;
}

export interface BestBallSummarySide {
  bestGross: number;
  bestGrossPlayerId: number;
  bestNet: number | null;
  bestNetPlayerId: number | null;
}

export interface FoursomeSummary {
  groupGross?: number;
  groupNet?: number | null;
  teamA?: BestBallSummarySide | null;
  teamB?: BestBallSummarySide | null;
  leadingTeam?: 'A' | 'B' | 'tie' | null;
  matchups?: {
    playerA: { id: number; name: string; team: Team; score: Score | null };
    playerB: { id: number; name: string; team: Team; score: Score | null };
    winnerPlayerId: number | 'tie' | null;
  }[];
}

export interface Foursome {
  id: number;
  segment_id: number;
  name: string;
  format: Format;
  players: FoursomePlayer[];
  scores: Score[];
  summary: FoursomeSummary | null;
}

export interface Segment {
  id: number;
  event_id: number;
  name: string;
  hole_start: number;
  hole_end: number;
  sort_order: number;
  foursomes: Foursome[];
}

export interface EventPoints {
  id: number;
  player_id: number;
  points: number;
  placement: number | null;
  notes: string | null;
  player_name: string;
  player_nickname: string | null;
}

export interface EventDetail {
  id: number;
  name: string;
  date: string;
  course_name: string | null;
  total_holes: 18 | 36;
  status: EventStatus;
  handicaps_enabled: boolean;
  segments: Segment[];
  points: EventPoints[];
}

export interface SeasonSettings {
  year: number;
  players: { id: number; name: string; nickname: string | null; team: Team | null }[];
}
