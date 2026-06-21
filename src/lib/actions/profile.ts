"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type ProfileFormState = { ok?: boolean; error?: string } | undefined;

const currentYear = new Date().getFullYear();

// Prázdné stringy z formuláře → undefined (uloží se null).
const optionalStr = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().max(max).optional(),
  );

const optionalInt = (min: number, max: number, msg: string) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.coerce.number().int().min(min, msg).max(max, msg).optional(),
  );

const profileSchema = z.object({
  heightCm: optionalInt(50, 300, "Výška musí být 50–300 cm."),
  birthYear: optionalInt(1900, currentYear, `Rok narození musí být 1900–${currentYear}.`),
  sex: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum(["m", "f", "other"]).optional(),
  ),
  goal: optionalStr(500),
  unit: z.enum(["metric", "imperial"]).default("metric"),
});

export async function updateProfileAction(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { error: "Nejsi přihlášený." };

  const parsed = profileSchema.safeParse({
    heightCm: formData.get("heightCm"),
    birthYear: formData.get("birthYear"),
    sex: formData.get("sex"),
    goal: formData.get("goal"),
    unit: formData.get("unit"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Neplatné údaje." };

  const { heightCm, birthYear, sex, goal, unit } = parsed.data;
  const data = {
    heightCm: heightCm ?? null,
    birthYear: birthYear ?? null,
    sex: sex ?? null,
    goal: goal ?? null,
    unit,
  };

  await prisma.profile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });

  revalidatePath("/profil");
  return { ok: true };
}
