export type Format = {
  id: string;
  label: string;
  shortLabel: string;
  scoring: "standard" | "halfppr" | "ppr";
  qbs: 1 | 2;
  tePremium: boolean;
  /** FantasyCalc API query params for this format */
  fcParams: Record<string, string | number | boolean>;
};

export const FORMATS: Format[] = [
  {
    id: "standard_1qb",
    label: "Standard · 1QB",
    shortLabel: "Std",
    scoring: "standard",
    qbs: 1,
    tePremium: false,
    fcParams: { isDynasty: false, numQbs: 1, ppr: 0, numTeams: 12 },
  },
  {
    id: "halfppr_1qb",
    label: "Half PPR · 1QB",
    shortLabel: "½PPR",
    scoring: "halfppr",
    qbs: 1,
    tePremium: false,
    fcParams: { isDynasty: false, numQbs: 1, ppr: 0.5, numTeams: 12 },
  },
  {
    id: "ppr_1qb",
    label: "Full PPR · 1QB",
    shortLabel: "PPR",
    scoring: "ppr",
    qbs: 1,
    tePremium: false,
    fcParams: { isDynasty: false, numQbs: 1, ppr: 1, numTeams: 12 },
  },
  {
    id: "standard_2qb",
    label: "Standard · Superflex",
    shortLabel: "Std SF",
    scoring: "standard",
    qbs: 2,
    tePremium: false,
    fcParams: { isDynasty: false, numQbs: 2, ppr: 0, numTeams: 12 },
  },
  {
    id: "halfppr_2qb",
    label: "Half PPR · Superflex",
    shortLabel: "½PPR SF",
    scoring: "halfppr",
    qbs: 2,
    tePremium: false,
    fcParams: { isDynasty: false, numQbs: 2, ppr: 0.5, numTeams: 12 },
  },
  {
    id: "ppr_2qb",
    label: "Full PPR · Superflex",
    shortLabel: "PPR SF",
    scoring: "ppr",
    qbs: 2,
    tePremium: false,
    fcParams: { isDynasty: false, numQbs: 2, ppr: 1, numTeams: 12 },
  },
  {
    id: "teprem_halfppr_1qb",
    label: "TE Prem · Half PPR · 1QB",
    shortLabel: "TE ½PPR",
    scoring: "halfppr",
    qbs: 1,
    tePremium: true,
    fcParams: { isDynasty: false, numQbs: 1, ppr: 0.5, numTeams: 12, tePremium: 1 },
  },
  {
    id: "teprem_ppr_1qb",
    label: "TE Prem · Full PPR · 1QB",
    shortLabel: "TE PPR",
    scoring: "ppr",
    qbs: 1,
    tePremium: true,
    fcParams: { isDynasty: false, numQbs: 1, ppr: 1, numTeams: 12, tePremium: 1 },
  },
];

export const FORMAT_MAP = new Map(FORMATS.map((f) => [f.id, f]));

export const DEFAULT_FORMAT_ID = "halfppr_1qb";

/** Build the canonical format ID from three selector values. Returns null if
 *  the combination has no defined format (e.g. teprem + superflex). */
export function resolveFormatId(
  scoring: Format["scoring"],
  qbs: 1 | 2,
  tePremium: boolean,
): string | null {
  if (tePremium) {
    if (qbs !== 1) return null;
    if (scoring === "standard") return null;
    return `teprem_${scoring}_1qb`;
  }
  return `${scoring}_${qbs === 2 ? "2qb" : "1qb"}`;
}
