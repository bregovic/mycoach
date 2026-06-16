"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/auth";

export type FormState = { error?: string } | undefined;

const registerSchema = z.object({
  name: z.string().trim().min(1, "Zadej jméno.").max(80),
  email: z.string().trim().toLowerCase().email("Neplatný e-mail."),
  password: z.string().min(8, "Heslo musí mít aspoň 8 znaků."),
});

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Neplatné údaje." };
  const { name, email, password } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (exists) return { error: "Účet s tímto e-mailem už existuje." };

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { name, email, passwordHash } });

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  } catch (e) {
    if (e instanceof AuthError) return { error: "Registrace proběhla, ale přihlášení selhalo. Přihlas se prosím." };
    throw e; // redirect
  }
  return undefined;
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Vyplň e-mail i heslo." };

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  } catch (e) {
    if (e instanceof AuthError) return { error: "Špatný e-mail nebo heslo." };
    throw e; // redirect
  }
  return undefined;
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
