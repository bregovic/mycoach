"use client";

import { useActionState } from "react";
import { updateProfileAction, type ProfileFormState } from "@/lib/actions/profile";

export type ProfileValues = {
  heightCm: number | null;
  birthYear: number | null;
  sex: string | null;
  goal: string | null;
  unit: string;
};

const inputClass =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900";
const labelClass = "text-sm font-medium text-zinc-700";

export function ProfileForm({ values }: { values: ProfileValues }) {
  const [state, formAction, pending] = useActionState<ProfileFormState, FormData>(
    updateProfileAction,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="heightCm" className={labelClass}>Výška (cm)</label>
          <input id="heightCm" name="heightCm" type="number" min={50} max={300}
            defaultValue={values.heightCm ?? ""} placeholder="např. 180" className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="birthYear" className={labelClass}>Rok narození</label>
          <input id="birthYear" name="birthYear" type="number" min={1900} max={2100}
            defaultValue={values.birthYear ?? ""} placeholder="např. 1990" className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="sex" className={labelClass}>Pohlaví</label>
          <select id="sex" name="sex" defaultValue={values.sex ?? ""} className={inputClass}>
            <option value="">Neuvedeno</option>
            <option value="m">Muž</option>
            <option value="f">Žena</option>
            <option value="other">Jiné</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="unit" className={labelClass}>Jednotky</label>
          <select id="unit" name="unit" defaultValue={values.unit} className={inputClass}>
            <option value="metric">Metrické (kg, cm)</option>
            <option value="imperial">Imperiální (lb, in)</option>
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="goal" className={labelClass}>Cíl</label>
        <textarea id="goal" name="goal" rows={3} maxLength={500}
          defaultValue={values.goal ?? ""} placeholder="Čeho chceš dosáhnout? (např. shodit 5 kg, zlepšit kondici…)"
          className={`${inputClass} resize-none`} />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      {state?.ok && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">Profil uložen ✓</p>
      )}

      <button type="submit" disabled={pending}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60">
        {pending ? "Ukládám…" : "Uložit profil"}
      </button>
    </form>
  );
}
