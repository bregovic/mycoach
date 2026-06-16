"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { FormState } from "@/lib/actions/auth";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

export function AuthForm({ mode, action }: { mode: "login" | "register"; action: Action }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined);
  const isRegister = mode === "register";

  return (
    <div className="mx-auto w-full max-w-sm">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        {isRegister ? "Vytvořit účet" : "Přihlášení"}
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        {isRegister ? "Začni sledovat svůj trénink." : "Vítej zpět v MyCoach."}
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        {isRegister && (
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium text-zinc-700">Jméno</label>
            <input id="name" name="name" autoComplete="name" required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900" />
          </div>
        )}
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-zinc-700">E-mail</label>
          <input id="email" name="email" type="email" autoComplete="email" required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900" />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium text-zinc-700">Heslo</label>
          <input id="password" name="password" type="password"
            autoComplete={isRegister ? "new-password" : "current-password"} required minLength={isRegister ? 8 : undefined}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900" />
        </div>

        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
        )}

        <button type="submit" disabled={pending}
          className="w-full rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60">
          {pending ? "Pracuji…" : isRegister ? "Vytvořit účet" : "Přihlásit se"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        {isRegister ? (
          <>Už máš účet? <Link href="/login" className="font-medium text-zinc-900 hover:underline">Přihlas se</Link></>
        ) : (
          <>Nemáš účet? <Link href="/register" className="font-medium text-zinc-900 hover:underline">Zaregistruj se</Link></>
        )}
      </p>
    </div>
  );
}
