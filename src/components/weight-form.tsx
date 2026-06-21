"use client";

import { useActionState } from "react";
import { logWeightAction, type WeightFormState } from "@/lib/actions/metrics";

const inputClass =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900";
const labelClass = "text-sm font-medium text-zinc-700";

export function WeightForm() {
  const [state, formAction, pending] = useActionState<WeightFormState, FormData>(
    logWeightAction,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="weightKg" className={labelClass}>Váha (kg)</label>
          <input id="weightKg" name="weightKg" type="number" step="0.1" min={20} max={500}
            required placeholder="např. 82.5" className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="bodyFat" className={labelClass}>% tuku <span className="text-zinc-400">(nepovinné)</span></label>
          <input id="bodyFat" name="bodyFat" type="number" step="0.1" min={1} max={70}
            placeholder="např. 18" className={inputClass} />
        </div>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      {state?.ok && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">Váha zapsána ✓</p>
      )}

      <button type="submit" disabled={pending}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60">
        {pending ? "Ukládám…" : "Zapsat váhu"}
      </button>
    </form>
  );
}
