"use client";

import { teamLogoUrl } from "@/lib/teams";

export function TeamLogo({
  team,
  size = 20,
  className = "",
}: {
  team: string | null | undefined;
  size?: number;
  className?: string;
}) {
  const url = teamLogoUrl(team);
  if (!url) return null;
  return (
    <img
      src={url}
      alt={team ?? ""}
      width={size}
      height={size}
      className={`object-contain ${className}`}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
      }}
    />
  );
}
