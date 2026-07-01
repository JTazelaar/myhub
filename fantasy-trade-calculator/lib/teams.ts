const NFL_ABBREV_MAP: Record<string, string> = {
  ARI: "ari",
  ATL: "atl",
  BAL: "bal",
  BUF: "buf",
  CAR: "car",
  CHI: "chi",
  CIN: "cin",
  CLE: "cle",
  DAL: "dal",
  DEN: "den",
  DET: "det",
  GB: "gb",
  HOU: "hou",
  IND: "ind",
  JAC: "jax",
  JAX: "jax",
  KC: "kc",
  LAC: "lac",
  LAR: "lar",
  LV: "lv",
  MIA: "mia",
  MIN: "min",
  NE: "ne",
  NO: "no",
  NYG: "nyg",
  NYJ: "nyj",
  PHI: "phi",
  PIT: "pit",
  SEA: "sea",
  SF: "sf",
  TB: "tb",
  TEN: "ten",
  WAS: "wsh",
  WSH: "wsh",
};

export function teamLogoUrl(team: string | null | undefined): string | null {
  if (!team) return null;
  const slug = NFL_ABBREV_MAP[team.toUpperCase()];
  if (!slug) return null;
  return `https://a.espncdn.com/i/teamlogos/nfl/500/${slug}.png`;
}
