import { prisma } from "@/lib/prisma";
import { soundUrl } from "@/lib/sounds";

/** Načte uživatelovy zvukové pokyny seskupené podle typu (URL pro přehrávač). */
export async function getUserCues(userId: string): Promise<Record<string, string[]>> {
  const rows = await prisma.userSound.findMany({
    where: { userId },
    select: { type: true, audioKey: true },
  });
  const out: Record<string, string[]> = {};
  for (const r of rows) (out[r.type] ??= []).push(soundUrl(r.audioKey));
  return out;
}
