"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { FORMATS, FORMAT_MAP, resolveFormatId, DEFAULT_FORMAT_ID } from "@/lib/formats";
import type { Format } from "@/lib/formats";

function parseFormat(id: string): { scoring: Format["scoring"]; qbs: 1 | 2; tePremium: boolean } {
  const f = FORMAT_MAP.get(id);
  if (!f) return { scoring: "halfppr", qbs: 1, tePremium: false };
  return { scoring: f.scoring, qbs: f.qbs, tePremium: f.tePremium };
}

type Props = { formatId: string };

const SCORING_OPTIONS: { id: Format["scoring"]; label: string }[] = [
  { id: "standard", label: "Standard" },
  { id: "halfppr", label: "½ PPR" },
  { id: "ppr", label: "Full PPR" },
];

const pillBase =
  "rounded-full px-3.5 py-1.5 text-sm font-medium transition-all select-none cursor-pointer";

const pillActive = {
  background: "rgba(255,255,255,0.16)",
  border: "1px solid rgba(255,255,255,0.24)",
  color: "rgba(255,255,255,0.94)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
} as const;

const pillInactive = {
  background: "transparent",
  border: "1px solid rgba(255,255,255,0.09)",
  color: "rgba(255,255,255,0.40)",
} as const;

const pillDisabled = {
  background: "transparent",
  border: "1px solid rgba(255,255,255,0.05)",
  color: "rgba(255,255,255,0.20)",
  cursor: "not-allowed",
} as const;

export function FormatPicker({ formatId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const { scoring, qbs, tePremium } = parseFormat(formatId);

  function navigate(newScoring: Format["scoring"], newQbs: 1 | 2, newTePremium: boolean) {
    const resolved = resolveFormatId(newScoring, newQbs, newTePremium);
    const id = resolved ?? DEFAULT_FORMAT_ID;
    const params = new URLSearchParams(searchParams.toString());
    params.set("format", id);
    params.delete("pos"); // reset position filter on format change
    startTransition(() => {
      router.push(`/?${params.toString()}`);
    });
  }

  const tePremiumAvailable = qbs === 1 && scoring !== "standard";

  return (
    <div
      className="flex flex-col gap-2"
      style={{ opacity: isPending ? 0.6 : 1, transition: "opacity 0.15s" }}
    >
      {/* Row 1: Scoring */}
      <div className="flex flex-wrap gap-1.5">
        <span className="flex items-center pr-1 text-xs font-medium uppercase tracking-wider text-white/30">
          Scoring
        </span>
        {SCORING_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            className={pillBase}
            style={scoring === opt.id ? pillActive : pillInactive}
            onClick={() => navigate(opt.id, qbs, tePremium && opt.id !== "standard")}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Row 2: QB format + TE Premium */}
      <div className="flex flex-wrap gap-1.5">
        <span className="flex items-center pr-1 text-xs font-medium uppercase tracking-wider text-white/30">
          Format
        </span>
        <button
          className={pillBase}
          style={qbs === 1 ? pillActive : pillInactive}
          onClick={() => navigate(scoring, 1, tePremium)}
        >
          1QB
        </button>
        <button
          className={pillBase}
          style={qbs === 2 ? pillActive : pillInactive}
          onClick={() => navigate(scoring, 2, false)}
        >
          Superflex
        </button>

        <span className="mx-1 flex items-center text-white/15">|</span>

        <button
          className={pillBase}
          disabled={!tePremiumAvailable}
          style={
            !tePremiumAvailable
              ? pillDisabled
              : tePremium
                ? { ...pillActive, border: "1px solid rgba(52,211,153,0.35)", color: "rgba(110,231,183,0.94)" }
                : pillInactive
          }
          onClick={() => tePremiumAvailable && navigate(scoring, qbs, !tePremium)}
          title={!tePremiumAvailable ? "TE Premium requires 1QB + PPR or ½PPR" : undefined}
        >
          TE+
        </button>
      </div>
    </div>
  );
}

// Compact label showing the currently selected format
export function FormatLabel({ formatId }: { formatId: string }) {
  const f = FORMAT_MAP.get(formatId);
  return (
    <span className="text-xs text-white/40">
      {f ? f.label : formatId}
    </span>
  );
}
