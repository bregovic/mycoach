"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CATEGORY_ORDER } from "@/lib/trainer/types";
import { dateKey, keyToDate } from "@/lib/calendar";
import { storage } from "@/lib/storage";

const ITEM_AUDIO_PREFIX = "mycoach/exercise-audio";

async function requireUserId(): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new Error("Neautorizováno.");
  return id;
}

const COOPS = ["najednou", "stridave", "v_pulce", "cele_kolo"];

const clampInt = (v: unknown, min: number, max: number, fallback: number): number => {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

const str = (v: unknown, max: number): string => String(v ?? "").trim().slice(0, max);

function revalidate(trainingId?: string) {
  revalidatePath("/treninky");
  if (trainingId) revalidatePath(`/treninky/${trainingId}`);
}

// --- Trénink (hlavička) ----------------------------------------------------

const DIFFICULTIES = ["zacatecnik", "mirne_pokrocily", "pokrocily", "expert"];

export async function createTraining(): Promise<void> {
  const userId = await requireUserId();
  const last = await prisma.training.findFirst({
    where: { userId },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  const t = await prisma.training.create({
    data: { userId, title: "Nový trénink", sportSlug: "box", number: (last?.number ?? 0) + 1 },
    select: { id: true },
  });
  redirect(`/treninky/${t.id}`);
}

export async function updateTrainingMeta(input: {
  id: string;
  title: string;
  description?: string;
  sportSlug?: string;
  difficulty?: string;
  targetMin?: number | null;
  isPublic?: boolean;
  prepareSec: number;
  betweenBlocksSec?: number;
}): Promise<void> {
  const userId = await requireUserId();
  const title = str(input.title, 80) || "Bez názvu";
  const difficulty =
    input.difficulty && DIFFICULTIES.includes(input.difficulty) ? input.difficulty : null;
  const targetMin =
    input.targetMin && input.targetMin > 0 ? clampInt(input.targetMin, 1, 600, 60) : null;
  await prisma.training.updateMany({
    where: { id: input.id, userId },
    data: {
      title,
      description: str(input.description, 500) || null,
      sportSlug: str(input.sportSlug, 40) || null,
      difficulty,
      targetMin,
      isPublic: Boolean(input.isPublic),
      prepareSec: clampInt(input.prepareSec, 0, 120, 10),
      betweenBlocksSec: clampInt(input.betweenBlocksSec, 0, 600, 60),
    },
  });
  revalidate(input.id);
}

export async function updateTrainingImage(id: string, dataUrl: string | null): Promise<void> {
  const userId = await requireUserId();
  const value =
    typeof dataUrl === "string" &&
    dataUrl.length <= 400_000 &&
    /^data:image\/(jpeg|png|webp);base64,/.test(dataUrl)
      ? dataUrl
      : null;
  await prisma.training.updateMany({ where: { id, userId }, data: { imageUrl: value } });
  revalidate(id);
}

export async function deleteTraining(id: string): Promise<void> {
  const userId = await requireUserId();
  await prisma.training.deleteMany({ where: { id, userId } }); // cascade smaže bloky i položky
  revalidatePath("/treninky");
  redirect("/treninky"); // jinak by se refreshla smazaná stránka → 404
}

/** Přidá veřejný (nebo vlastní) trénink do kalendáře jako úkol na dnešek. */
export async function addTrainingToCalendar(trainingId: string): Promise<void> {
  const userId = await requireUserId();
  const training = await prisma.training.findFirst({
    where: { id: trainingId, OR: [{ userId }, { isPublic: true }] },
    select: { id: true, title: true, targetMin: true },
  });
  if (!training) return;

  const activity = await prisma.activity.create({
    data: { userId, name: training.title.slice(0, 60) || "Trénink", color: "#ef4444", sportSlug: "box" },
    select: { id: true },
  });
  await prisma.scheduledTask.create({
    data: {
      userId,
      activityId: activity.id,
      date: keyToDate(dateKey(new Date())),
      title: training.title.slice(0, 80),
      durationMin: training.targetMin ?? null,
      note: "Z veřejných tréninků",
    },
  });
  revalidatePath("/kalendar");
  revalidatePath("/treninky");
}

// --- Bloky -----------------------------------------------------------------

export async function addBlock(trainingId: string): Promise<void> {
  const userId = await requireUserId();
  const owned = await prisma.training.findFirst({
    where: { id: trainingId, userId },
    select: { id: true },
  });
  if (!owned) return;
  const count = await prisma.block.count({ where: { trainingId } });
  await prisma.block.create({
    data: { trainingId, order: count, title: "Nový blok", rounds: 1, restSec: 60 },
  });
  revalidate(trainingId);
}

export async function updateBlock(input: {
  id: string;
  title: string;
  category?: string | null;
  rounds: number;
  restSec: number;
  restBetweenItems?: boolean;
}): Promise<void> {
  const userId = await requireUserId();
  const category =
    input.category && (CATEGORY_ORDER as string[]).includes(input.category) ? input.category : null;
  const block = await prisma.block.findFirst({
    where: { id: input.id, training: { userId } },
    select: { trainingId: true },
  });
  if (!block) return;
  await prisma.block.update({
    where: { id: input.id },
    data: {
      title: str(input.title, 60) || "Blok",
      category,
      rounds: clampInt(input.rounds, 1, 50, 1),
      restSec: clampInt(input.restSec, 0, 600, 60),
      restBetweenItems: Boolean(input.restBetweenItems),
    },
  });
  revalidate(block.trainingId);
}

/** Nastaví aktivní pauzu mezi koly = kondiční cvik (nebo null = klasické vydýchání). */
export async function setBlockRest(blockId: string, exerciseId: string | null): Promise<void> {
  const userId = await requireUserId();
  const block = await prisma.block.findFirst({
    where: { id: blockId, training: { userId } },
    select: { trainingId: true },
  });
  if (!block) return;
  if (!exerciseId) {
    await prisma.block.update({
      where: { id: blockId },
      data: { restName: null, restSpokenName: null, restVoiceText: null, restAudioKey: null },
    });
  } else {
    const ex = await prisma.exercise.findUnique({
      where: { id: exerciseId },
      select: { name: true, spokenName: true, voiceText: true, audioKey: true },
    });
    if (ex) {
      await prisma.block.update({
        where: { id: blockId },
        data: {
          restName: ex.name,
          restSpokenName: ex.spokenName,
          restVoiceText: ex.voiceText,
          restAudioKey: ex.audioKey,
        },
      });
    }
  }
  revalidate(block.trainingId);
}

/** Nahraje MP3 k aktivní pauze bloku (kondiční cvik). FormData: blockId + file. */
export async function uploadBlockRestAudio(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const id = String(formData.get("blockId") ?? "");
  const file = formData.get("file");
  if (!(file instanceof File) || !id) return;
  const block = await prisma.block.findFirst({
    where: { id, training: { userId } },
    select: { id: true, restAudioKey: true, trainingId: true },
  });
  if (!block) return;
  const okType = file.type === "audio/mpeg" || file.name.toLowerCase().endsWith(".mp3");
  if (!okType || file.size === 0 || file.size > 8 * 1024 * 1024) return;
  const buf = Buffer.from(await file.arrayBuffer());
  const key = await storage.save(buf, file.name || "pauza.mp3", ITEM_AUDIO_PREFIX);
  if (block.restAudioKey) await storage.delete(block.restAudioKey);
  await prisma.block.update({ where: { id }, data: { restAudioKey: key } });
  revalidate(block.trainingId);
}

export async function removeBlockRestAudio(id: string): Promise<void> {
  const userId = await requireUserId();
  const block = await prisma.block.findFirst({
    where: { id, training: { userId } },
    select: { id: true, restAudioKey: true, trainingId: true },
  });
  if (!block) return;
  if (block.restAudioKey) await storage.delete(block.restAudioKey);
  await prisma.block.update({ where: { id }, data: { restAudioKey: null } });
  revalidate(block.trainingId);
}

export async function deleteBlock(id: string): Promise<void> {
  const userId = await requireUserId();
  const block = await prisma.block.findFirst({
    where: { id, training: { userId } },
    select: { trainingId: true },
  });
  if (!block) return;
  await prisma.block.delete({ where: { id } });
  revalidate(block.trainingId);
}

export async function moveBlock(id: string, dir: "up" | "down"): Promise<void> {
  const userId = await requireUserId();
  const block = await prisma.block.findFirst({
    where: { id, training: { userId } },
    select: { id: true, order: true, trainingId: true },
  });
  if (!block) return;
  const neighbor = await prisma.block.findFirst({
    where:
      dir === "up"
        ? { trainingId: block.trainingId, order: { lt: block.order } }
        : { trainingId: block.trainingId, order: { gt: block.order } },
    orderBy: { order: dir === "up" ? "desc" : "asc" },
    select: { id: true, order: true },
  });
  if (neighbor) {
    await prisma.$transaction([
      prisma.block.update({ where: { id: block.id }, data: { order: neighbor.order } }),
      prisma.block.update({ where: { id: neighbor.id }, data: { order: block.order } }),
    ]);
  }
  revalidate(block.trainingId);
}

// --- Položky (cviky) -------------------------------------------------------

export async function addItem(blockId: string): Promise<void> {
  const userId = await requireUserId();
  const block = await prisma.block.findFirst({
    where: { id: blockId, training: { userId } },
    select: { id: true, trainingId: true },
  });
  if (!block) return;
  const count = await prisma.blockItem.count({ where: { blockId } });
  await prisma.blockItem.create({
    data: { blockId, order: count, name: "Nový cvik", durationSec: 180, coop: "najednou" },
  });
  revalidate(block.trainingId);
}

/**
 * Přidá cvik z číselníku Exercise do bloku. Hlídá duplicity v rámci bloku
 * (stejné exerciseId se nepřidá podruhé). Vrací false, pokud už tam je.
 */
export async function addItemFromExercise(
  blockId: string,
  exerciseId: string,
): Promise<{ added: boolean }> {
  const userId = await requireUserId();
  const block = await prisma.block.findFirst({
    where: { id: blockId, training: { userId } },
    select: { id: true, trainingId: true },
  });
  if (!block) return { added: false };

  const ex = await prisma.exercise.findUnique({ where: { id: exerciseId } });
  if (!ex) return { added: false };

  const dup = await prisma.blockItem.findFirst({
    where: { blockId, exerciseId },
    select: { id: true },
  });
  if (dup) return { added: false }; // už je v bloku

  const count = await prisma.blockItem.count({ where: { blockId } });
  await prisma.blockItem.create({
    data: {
      blockId,
      order: count,
      exerciseId: ex.id,
      name: ex.name,
      spokenName: ex.spokenName,
      voiceText: ex.voiceText,
      coop: ex.coop ?? "najednou",
      durationSec: ex.defaultSec ?? 180,
      audioKey: ex.audioKey,
    },
  });
  revalidate(block.trainingId);
  return { added: true };
}

export async function updateItem(input: {
  id: string;
  name: string;
  spokenName?: string;
  voiceText?: string;
  coop?: string;
  durationSec: number;
}): Promise<void> {
  const userId = await requireUserId();
  const item = await prisma.blockItem.findFirst({
    where: { id: input.id, block: { training: { userId } } },
    select: { id: true, block: { select: { trainingId: true } } },
  });
  if (!item) return;
  const coop = input.coop && COOPS.includes(input.coop) ? input.coop : "najednou";
  await prisma.blockItem.update({
    where: { id: input.id },
    data: {
      name: str(input.name, 80) || "Cvik",
      spokenName: str(input.spokenName, 120) || null,
      voiceText: str(input.voiceText, 300) || null,
      coop,
      durationSec: clampInt(input.durationSec, 5, 1800, 180),
    },
  });
  revalidate(item.block.trainingId);
}

/** Nahraje MP3 instrukci přímo k položce bloku. FormData: itemId + file. */
export async function uploadItemAudio(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const id = String(formData.get("itemId") ?? "");
  const file = formData.get("file");
  if (!(file instanceof File) || !id) return;
  const item = await prisma.blockItem.findFirst({
    where: { id, block: { training: { userId } } },
    select: { id: true, audioKey: true, block: { select: { trainingId: true } } },
  });
  if (!item) return;
  const okType = file.type === "audio/mpeg" || file.name.toLowerCase().endsWith(".mp3");
  if (!okType || file.size === 0 || file.size > 8 * 1024 * 1024) return;
  const buf = Buffer.from(await file.arrayBuffer());
  const key = await storage.save(buf, file.name || "instrukce.mp3", ITEM_AUDIO_PREFIX);
  if (item.audioKey) await storage.delete(item.audioKey);
  await prisma.blockItem.update({ where: { id }, data: { audioKey: key } });
  revalidate(item.block.trainingId);
}

export async function removeItemAudio(id: string): Promise<void> {
  const userId = await requireUserId();
  const item = await prisma.blockItem.findFirst({
    where: { id, block: { training: { userId } } },
    select: { id: true, audioKey: true, block: { select: { trainingId: true } } },
  });
  if (!item) return;
  if (item.audioKey) await storage.delete(item.audioKey);
  await prisma.blockItem.update({ where: { id }, data: { audioKey: null } });
  revalidate(item.block.trainingId);
}

export async function deleteItem(id: string): Promise<void> {
  const userId = await requireUserId();
  const item = await prisma.blockItem.findFirst({
    where: { id, block: { training: { userId } } },
    select: { id: true, block: { select: { trainingId: true } } },
  });
  if (!item) return;
  await prisma.blockItem.delete({ where: { id } });
  revalidate(item.block.trainingId);
}

export async function moveItem(id: string, dir: "up" | "down"): Promise<void> {
  const userId = await requireUserId();
  const item = await prisma.blockItem.findFirst({
    where: { id, block: { training: { userId } } },
    select: { id: true, order: true, blockId: true, block: { select: { trainingId: true } } },
  });
  if (!item) return;
  const neighbor = await prisma.blockItem.findFirst({
    where:
      dir === "up"
        ? { blockId: item.blockId, order: { lt: item.order } }
        : { blockId: item.blockId, order: { gt: item.order } },
    orderBy: { order: dir === "up" ? "desc" : "asc" },
    select: { id: true, order: true },
  });
  if (neighbor) {
    await prisma.$transaction([
      prisma.blockItem.update({ where: { id: item.id }, data: { order: neighbor.order } }),
      prisma.blockItem.update({ where: { id: neighbor.id }, data: { order: item.order } }),
    ]);
  }
  revalidate(item.block.trainingId);
}

// --- Záznam odcvičeného tréninku ------------------------------------------

export async function logCompletedWorkout(input: {
  title: string;
  sportSlug?: string | null;
  durationMin: number;
  rounds: number;
}): Promise<void> {
  const userId = await requireUserId();
  await prisma.workoutLog.create({
    data: {
      userId,
      title: str(input.title, 80) || "Trénink",
      durationMin: clampInt(input.durationMin, 0, 600, 0) || null,
      data: { rounds: input.rounds, sportSlug: input.sportSlug ?? null, source: "trainer" },
    },
  });
  revalidatePath("/profil");
}
