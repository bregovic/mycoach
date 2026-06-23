"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { SOUND_KEYS } from "@/lib/sounds";

const PREFIX = "mycoach/sounds";

async function requireUserId(): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new Error("Neautorizováno.");
  return id;
}

/** Nahraje MP3 zvukový pokyn daného typu (cue). FormData: type + file. */
export async function uploadUserSound(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const type = String(formData.get("type") ?? "");
  const file = formData.get("file");
  if (!SOUND_KEYS.includes(type) || !(file instanceof File)) return;
  const okType = file.type === "audio/mpeg" || file.name.toLowerCase().endsWith(".mp3");
  if (!okType || file.size === 0 || file.size > 5 * 1024 * 1024) return; // max 5 MB

  const buf = Buffer.from(await file.arrayBuffer());
  const key = await storage.save(buf, file.name || "cue.mp3", PREFIX);
  await prisma.userSound.create({ data: { userId, type, audioKey: key } });
  revalidatePath("/profil");
}

export async function deleteUserSound(id: string): Promise<void> {
  const userId = await requireUserId();
  const s = await prisma.userSound.findFirst({ where: { id, userId }, select: { audioKey: true } });
  if (!s) return;
  await storage.delete(s.audioKey);
  await prisma.userSound.delete({ where: { id } });
  revalidatePath("/profil");
}
