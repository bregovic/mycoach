"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CATEGORY_ORDER } from "@/lib/trainer/types";

const COOPS = ["najednou", "stridave", "v_pulce", "cele_kolo"];

// Role čteme čerstvě z DB (ne z JWT), aby změna role platila bez re-loginu.
async function requireAdmin(): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new Error("Neautorizováno.");
  const u = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (u?.role !== "admin") throw new Error("Jen pro administrátora.");
  return id;
}

export async function isAdmin(): Promise<boolean> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return false;
  const u = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  return u?.role === "admin";
}

const str = (v: unknown, max: number): string => String(v ?? "").trim().slice(0, max);
const clampSec = (v: unknown): number => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(1800, Math.max(5, n)) : 180;
};
const cat = (v: unknown): string | null =>
  v && (CATEGORY_ORDER as string[]).includes(String(v)) ? String(v) : null;
const coop = (v: unknown): string => (v && COOPS.includes(String(v)) ? String(v) : "najednou");

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

// --- Sporty ----------------------------------------------------------------

export async function createSport(input: { name: string; icon?: string }): Promise<void> {
  await requireAdmin();
  const name = str(input.name, 40);
  if (!name) return;
  let slug = slugify(name);
  let i = 1;
  // unikátní slug
  while (await prisma.sport.findUnique({ where: { slug }, select: { id: true } })) {
    i += 1;
    slug = `${slugify(name)}-${i}`;
  }
  await prisma.sport.create({ data: { slug, name, icon: str(input.icon, 8) || null } });
  revalidatePath("/admin/cviky");
}

// --- Cviky -----------------------------------------------------------------

export async function createExercise(input: {
  sportSlug: string;
  name: string;
  category?: string;
  coop?: string;
  defaultSec?: number;
  spokenName?: string;
  voiceText?: string;
}): Promise<void> {
  await requireAdmin();
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
      name,
      spokenName: str(input.spokenName, 120) || name,
      voiceText: str(input.voiceText, 300) || null,
      category: cat(input.category),
      coop: coop(input.coop),
      defaultSec: clampSec(input.defaultSec),
    },
  });
  revalidatePath("/admin/cviky");
}

export async function updateExercise(input: {
  id: string;
  name: string;
  category?: string;
  coop?: string;
  defaultSec?: number;
  spokenName?: string;
  voiceText?: string;
}): Promise<void> {
  await requireAdmin();
  const name = str(input.name, 80) || "Cvik";
  await prisma.exercise.update({
    where: { id: input.id },
    data: {
      name,
      spokenName: str(input.spokenName, 120) || name,
      voiceText: str(input.voiceText, 300) || null,
      category: cat(input.category),
      coop: coop(input.coop),
      defaultSec: clampSec(input.defaultSec),
    },
  });
  revalidatePath("/admin/cviky");
}

export async function deleteExercise(id: string): Promise<void> {
  await requireAdmin();
  await prisma.exercise.delete({ where: { id } }); // BlockItem.exerciseId → SetNull
  revalidatePath("/admin/cviky");
}
