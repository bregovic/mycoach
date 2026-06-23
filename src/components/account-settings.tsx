"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { changePassword, updateAccountEmail, updateAccountName, type Result } from "@/lib/actions/account";

const input =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500";
const label = "block text-xs font-medium uppercase tracking-wide text-zinc-500";
const btn = "rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800";

function Feedback({ r }: { r: Result | null }) {
  if (!r) return null;
  return <p className={`mt-2 text-sm ${r.ok ? "text-green-600" : "text-red-600"}`}>{r.ok ? r.message : r.error}</p>;
}

export function AccountSettings({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [nameRes, setNameRes] = useState<Result | null>(null);
  const [emailRes, setEmailRes] = useState<Result | null>(null);
  const [pwRes, setPwRes] = useState<Result | null>(null);

  return (
    <div className={`space-y-6 ${pending ? "opacity-60" : ""}`}>
      {/* Jméno */}
      <form
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(async () => {
            setNameRes(await updateAccountName(String(fd.get("name") ?? "")));
            router.refresh();
          });
        }}
      >
        <label className={label}>Jméno</label>
        <div className="mt-1 flex gap-2">
          <input name="name" defaultValue={name} placeholder="Tvoje jméno" className={input} />
          <button type="submit" className={`${btn} shrink-0`}>Uložit</button>
        </div>
        <Feedback r={nameRes} />
      </form>

      {/* E-mail */}
      <form
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(async () => {
            setEmailRes(await updateAccountEmail(String(fd.get("email") ?? "")));
            router.refresh();
          });
        }}
      >
        <label className={label}>E-mail (přihlašovací)</label>
        <div className="mt-1 flex gap-2">
          <input name="email" type="email" defaultValue={email} className={input} />
          <button type="submit" className={`${btn} shrink-0`}>Změnit</button>
        </div>
        <Feedback r={emailRes} />
      </form>

      {/* Heslo */}
      <form
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          const form = e.currentTarget;
          const fd = new FormData(form);
          startTransition(async () => {
            const res = await changePassword(String(fd.get("current") ?? ""), String(fd.get("next") ?? ""));
            setPwRes(res);
            if (res.ok) form.reset();
          });
        }}
      >
        <label className={label}>Změna hesla</label>
        <div className="mt-1 grid gap-2 sm:grid-cols-2">
          <input name="current" type="password" placeholder="Současné heslo" autoComplete="current-password" className={input} />
          <input name="next" type="password" placeholder="Nové heslo (min. 8 znaků)" autoComplete="new-password" className={input} />
        </div>
        <div className="mt-2">
          <button type="submit" className={btn}>Změnit heslo</button>
        </div>
        <Feedback r={pwRes} />
      </form>
    </div>
  );
}
