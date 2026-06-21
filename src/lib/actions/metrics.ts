"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type WeightFormState = { ok?: boolean; error?: string } | undefined;

const optionalNum = (min: number, max: number, msg: string) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.coerce.number().min(min, msg).max(max, msg).optional(),
  );

const weightSchema = z.object({
  weightKg: z.coerce.number({ message: "Zadej váhu." }).min(20, "Váha musí být 20–500 kg.").max(500, "Váha musí být 20–500 kg."),
  bodyFat: optionalNum(1, 70, "% tuku musí být 1–70."),
});

export async function logWeightAction(
  _prev: WeightFormState,
  formData: FormData,
): Promise<WeightFormState> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { error: "Nejsi přihlášený." };

  const parsed = weightSchema.safeParse({
    weightKg: formData.get("weightKg"),
    bodyFat: formData.get("bodyFat"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Neplatné údaje." };

  const { weightKg, bodyFat } = parsed.data;
  await prisma.bodyMetric.create({
    data: { userId, weightKg, bodyFat: bodyFat ?? null },
  });

  revalidatePath("/profil");
  return { ok: true };
}
