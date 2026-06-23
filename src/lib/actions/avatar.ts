"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Profilová fotka se ukládá jako data URL přímo do User.image (bez externího
// úložiště). Klient ji předem ořízne na čtverec a zkomprimuje – limit je pojistka.
const MAX_LEN = 300_000;
const DATA_URL = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

async function requireUserId(): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new Error("Neautorizováno.");
  return id;
}

export async function updateAvatarAction(dataUrl: string): Promise<void> {
  const userId = await requireUserId();
  if (typeof dataUrl !== "string" || dataUrl.length > MAX_LEN || !DATA_URL.test(dataUrl)) return;
  await prisma.user.update({ where: { id: userId }, data: { image: dataUrl } });
  revalidatePath("/dashboard");
  revalidatePath("/profil");
}

export async function removeAvatarAction(): Promise<void> {
  const userId = await requireUserId();
  await prisma.user.update({ where: { id: userId }, data: { image: null } });
  revalidatePath("/dashboard");
  revalidatePath("/profil");
}
