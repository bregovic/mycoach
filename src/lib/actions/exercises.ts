"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CATEGORY_ORDER } from "@/lib/trainer/types";

const COOPS = ["najednou", "stridave", "v_pulce", "cele_kolo"];

async function requireUser(): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new Error("Neautorizováno.");
  return id;
}

async function roleOf(userId: string): Promise<string> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  return u?.role ?? "user";
}

export async function isAdmin(): Promise<boolean> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return false;
  return (await roleOf(id)) === "admin";
}

async function requireAdmin(): Promise<string> {
  const userId = await requireUser();
  if ((await roleOf(userId)) !== "admin") throw new Error("Jen pro administrátora.");
  return userId;
}

const str = (v: unknown, max: number): string => String(v ?? "").trim().slice(0, max);
const clampInt = (v: unknown, min: number, max: number, fb: number): number => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fb;
};
const cat = (v: unknown): string | null =>
  v && (CATEGORY_ORDER as string[]).includes(String(v)) ? String(v) : null;
const coop = (v: unknown): string => (v && COOPS.includes(String(v)) ? String(v) : "najednou");
const HEX = /^#[0-9a-fA-F]{6}$/;

function slugify(input: string): string {
  return (
    input
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "sport"
  );
}

function revalidate() {
  revalidatePath("/cviky");
}

// --- Sporty (číselník) – admin --------------------------------------------

export async function createSport(input: { name: string; icon?: string }): Promise<void> {
  await requireAdmin();
  const name = str(input.name, 40);
  if (!name) return;
  let slug = slugify(name);
  let i = 1;
  while (await prisma.sport.findUnique({ where: { slug }, select: { id: true } })) {
    i += 1;
    slug = `${slugify(name)}-${i}`;
  }
  await prisma.sport.create({ data: { slug, name, icon: str(input.icon, 8) || null } });
  revalidate();
}

export async function updateSportImage(slug: string, dataUrl: string | null): Promise<void> {
  await requireAdmin();
  const value =
    typeof dataUrl === "string" &&
    dataUrl.length <= 400_000 &&
    /^data:image\/(jpeg|png|webp);base64,/.test(dataUrl)
      ? dataUrl
      : null;
  await prisma.sport.updateMany({ where: { slug }, data: { imageUrl: value } });
  revalidate();
}

// --- Cviky – kdokoli (vlastník = autor, soukromé, kopie při editaci) -------

export async function createExercise(input: {
  sportSlug: string;
  name: string;
  category?: string;
  coop?: string;
  defaultSec?: number;
  spokenName?: string;
  voiceText?: string;
  isPrivate?: boolean;
}): Promise<void> {
  const userId = await requireUser();
  const sport = await prisma.sport.findUnique({
    where: { slug: str(input.sportSlug, 40) },
    select: { id: true },
  });
  if (!sport) return;
  const name = str(input.name, 80);
  if (!name) return;
  await prisma.exercise.create({
    data: {
      sportId: sport.id,
      ownerId: userId,
      isPrivate: Boolean(input.isPrivate),
      name,
      spokenName: str(input.spokenName, 120) || name,
      voiceText: str(input.voiceText, 300) || null,
      category: cat(input.category),
      coop: coop(input.coop),
      defaultSec: clampInt(input.defaultSec, 5, 1800, 180),
    },
  });
  revalidate();
}

/**
 * Úprava cviku. Vlastník (nebo admin) edituje na místě; ostatní si vytvoří
 * vlastní kopii (původní zůstává nedotčen).
 */
export async function updateExercise(input: {
  id: string;
  name: string;
  category?: string;
  coop?: string;
  defaultSec?: number;
  spokenName?: string;
  voiceText?: string;
  isPrivate?: boolean;
}): Promise<void> {
  const userId = await requireUser();
  const ex = await prisma.exercise.findUnique({ where: { id: input.id } });
  if (!ex) return;

  const name = str(input.name, 80) || "Cvik";
  const data = {
    name,
    spokenName: str(input.spokenName, 120) || name,
    voiceText: str(input.voiceText, 300) || null,
    category: cat(input.category),
    coop: coop(input.coop),
    defaultSec: clampInt(input.defaultSec, 5, 1800, 180),
    isPrivate: Boolean(input.isPrivate),
  };

  const admin = (await roleOf(userId)) === "admin";
  if (ex.ownerId === userId || admin) {
    await prisma.exercise.update({ where: { id: ex.id }, data });
  } else {
    // kopie pro editujícího
    await prisma.exercise.create({ data: { ...data, sportId: ex.sportId, ownerId: userId } });
  }
  revalidate();
}

export async function deleteExercise(id: string): Promise<void> {
  const userId = await requireUser();
  const ex = await prisma.exercise.findUnique({ where: { id }, select: { ownerId: true } });
  if (!ex) return;
  const admin = (await roleOf(userId)) === "admin";
  if (ex.ownerId !== userId && !admin) return; // mažu jen vlastní (nebo admin)
  await prisma.exercise.delete({ where: { id } });
  revalidate();
}

// --- Prvky balíčků (ElementPreset) – admin (sjednocená správa) --------------

export async function createPreset(input: {
  name: string;
  note?: string;
  color: string;
  defaultIntervalDays: number;
  category?: string;
}): Promise<void> {
  await requireAdmin();
  const name = str(input.name, 60);
  if (!name) return;
  await prisma.elementPreset.create({
    data: {
      name,
      note: str(input.note, 200) || null,
      color: HEX.test(input.color) ? input.color : "#18181b",
      defaultIntervalDays: clampInt(input.defaultIntervalDays, 1, 365, 28),
      category: str(input.category, 40) || null,
    },
  });
  revalidate();
}

export async function updatePreset(input: {
  id: string;
  name: string;
  note?: string;
  color: string;
  defaultIntervalDays: number;
  category?: string;
}): Promise<void> {
  await requireAdmin();
  await prisma.elementPreset.update({
    where: { id: input.id },
    data: {
      name: str(input.name, 60) || "Prvek",
      note: str(input.note, 200) || null,
      color: HEX.test(input.color) ? input.color : "#18181b",
      defaultIntervalDays: clampInt(input.defaultIntervalDays, 1, 365, 28),
      category: str(input.category, 40) || null,
    },
  });
  revalidate();
}

export async function deletePreset(id: string): Promise<void> {
  await requireAdmin();
  await prisma.elementPreset.delete({ where: { id } });
  revalidate();
}
