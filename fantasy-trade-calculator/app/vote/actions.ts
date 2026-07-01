"use server";

import { redirect } from "next/navigation";
import { recordVote } from "@/lib/votes/votes";

export async function submitVoteAction(
  playerAId: number,
  playerBId: number,
  winnerId: number,
  formatId: string,
) {
  await recordVote(playerAId, playerBId, winnerId, formatId);
  redirect(`/vote?format=${encodeURIComponent(formatId)}`);
}
