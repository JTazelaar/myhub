"use server";

import { revalidatePath } from "next/cache";
import { createPlayer, setPlayerValue } from "@/lib/players/players";

export async function createPlayerAction(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const position = String(formData.get("position") || "").trim();
  const team = String(formData.get("team") || "").trim();
  const valueRaw = formData.get("value");

  if (!name || !position) return;

  const player = await createPlayer({ name, position, team: team || undefined });

  const value = valueRaw ? Number(valueRaw) : null;
  if (value !== null && !Number.isNaN(value)) {
    await setPlayerValue(player.id, value);
  }

  revalidatePath("/admin");
}

export async function setPlayerValueAction(playerId: number, formData: FormData) {
  const value = Number(formData.get("value"));
  if (Number.isNaN(value)) return;
  await setPlayerValue(playerId, value);
  revalidatePath("/admin");
}
