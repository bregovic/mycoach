"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireUserId(): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new Error("Neautorizováno.");
  return id;
}

export type Result = { ok: boolean; error?: string; message?: string };

export async function updateAccountName(name: string): Promise<Result> {
  const userId = await requireUserId();
  const n = String(name ?? "").trim().slice(0, 80);
  await prisma.user.update({ where: { id: userId }, data: { name: n || null } });
  revalidatePath("/profil");
  revalidatePath("/dashboard");
  return { ok: true, message: "Jméno uloženo." };
}

export async function updateAccountEmail(email: string): Promise<Result> {
  const userId = await requireUserId();
  const e = String(email ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return { ok: false, error: "Neplatný e-mail." };
  const existing = await prisma.user.findUnique({ where: { email: e }, select: { id: true } });
  if (existing && existing.id !== userId) return { ok: false, error: "E-mail už používá jiný účet." };
  await prisma.user.update({ where: { id: userId }, data: { email: e } });
  revalidatePath("/profil");
  return { ok: true, message: "E-mail změněn. Příště se přihlas tímto e-mailem." };
}

export async function changePassword(current: string, next: string): Promise<Result> {
  const userId = await requireUserId();
  if (String(next ?? "").length < 8) return { ok: false, error: "Nové heslo musí mít aspoň 8 znaků." };
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  if (!user?.passwordHash) return { ok: false, error: "Účet nemá nastavené heslo." };
  const ok = await bcrypt.compare(String(current ?? ""), user.passwordHash);
  if (!ok) return { ok: false, error: "Současné heslo nesedí." };
  const hash = await bcrypt.hash(String(next), 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
  return { ok: true, message: "Heslo změněno." };
}
