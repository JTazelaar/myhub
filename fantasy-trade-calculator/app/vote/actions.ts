"use server";
import { revalidatePath } from "next/cache";
import { recordVote } from "@/lib/votes/votes";
export async function submitVoteAction(playerAId: number, playerBId: number, winnerId: number) {
  await recordVote(playerAId, playerBId, winnerId);
  revalidatePath("/vote");
}
