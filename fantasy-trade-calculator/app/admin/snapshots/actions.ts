"use server";
import { revalidatePath } from "next/cache";
import { createNextSnapshot } from "@/lib/rankings/snapshots";
export async function createSnapshotAction(formData: FormData) {
  const season = Number(formData.get("season"));
  const week = Number(formData.get("week"));
  const label = String(formData.get("label") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  if (Number.isNaN(season) || Number.isNaN(week) || !label) return;
  await createNextSnapshot({ season, week, label, notes: notes || undefined });
  revalidatePath("/admin/snapshots");
  revalidatePath("/admin");
}
