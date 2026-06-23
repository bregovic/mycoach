"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  createExercise,
  createSport,
  deleteExercise,
  updateExercise,
} from "@/lib/actions/exercises";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/trainer/types";

export interface AdminSport {
  slug: string;
  name: string;
  icon: string | null;
}
export interface AdminExercise {
  id: string;
  name: string;
  category: string | null;
  coop: string | null;
  defaultSec: number | null;
  spokenName: string | null;
  voiceText: string | null;
  sportSlug: string;
}

const COOP_LABELS: Record<string, string> = {
  najednou: "Najednou",
  stridave: "Střídavě",
  v_pulce: "Výměna v půlce",
  cele_kolo: "Celé kolo",
};

const input =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500";
const label = "block text-xs font-medium uppercase tracking-wide text-zinc-500";

export function ExerciseAdmin({
  sports,
  exercises,
}: {
  sports: AdminSport[];
  exercises: AdminExercise[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [sport, setSport] = useState(sports[0]?.slug ?? "");
  const [filter, setFilter] = useState("");

  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      await fn();
      router.refresh();
    });

  const q = filter.trim().toLowerCase();
  const list = useMemo(
    () => exercises.filter((e) => e.sportSlug === sport && e.name.toLowerCase().includes(q)),
    [exercises, sport, q],
  );

  return (
    <div className={pending ? "pointer-events-none opacity-60" : ""}>
      {/* Výběr sportu + přidání sportu */}
      <div className="flex flex-wrap items-center gap-2">
        {sports.map((s) => (
          <button
            key={s.slug}
            type="button"
            onClick={() => setSport(s.slug)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              sport === s.slug ? "bg-zinc-900 text-white" : "border border-zinc-300 text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            {s.icon ? `${s.icon} ` : ""}
            {s.name}
          </button>
        ))}
        <form
          onSubmit={(e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const name = String(fd.get("name") ?? "").trim();
            if (!name) return;
            run(() => createSport({ name, icon: String(fd.get("icon") ?? "") }));
            e.currentTarget.reset();
          }}
          className="flex items-center gap-1"
        >
          <input name="icon" placeholder="🏃" maxLength={4} className="w-12 rounded-lg border border-zinc-300 px-2 py-1.5 text-center text-sm" />
          <input name="name" placeholder="Nový sport" className="w-32 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
          <button type="submit" className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100">+</button>
        </form>
      </div>

      {/* Přidat cvik */}
      <form
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const name = String(fd.get("name") ?? "").trim();
          if (!name || !sport) return;
          run(() =>
            createExercise({
              sportSlug: sport,
              name,
              category: String(fd.get("category") ?? ""),
              coop: String(fd.get("coop") ?? "najednou"),
              defaultSec: Number(fd.get("defaultSec") ?? 180),
              spokenName: String(fd.get("spokenName") ?? ""),
              voiceText: String(fd.get("voiceText") ?? ""),
            }),
          );
          e.currentTarget.reset();
        }}
        className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5"
      >
        <h2 className="text-base font-semibold text-zinc-900">Přidat cvik</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_150px_120px_90px]">
          <div>
            <label className={label}>Název</label>
            <input name="name" className={`${input} mt-1`} />
          </div>
          <div>
            <label className={label}>Kategorie</label>
            <select name="category" className={`${input} mt-1`}>
              <option value="">— bez —</option>
              {CATEGORY_ORDER.map((k) => (
                <option key={k} value={k}>{CATEGORY_LABELS[k]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Režim</label>
            <select name="coop" className={`${input} mt-1`}>
              {Object.entries(COOP_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Délka (s)</label>
            <input name="defaultSec" type="number" min={5} max={1800} defaultValue={180} className={`${input} mt-1`} />
          </div>
          <input name="spokenName" placeholder="Mluvený název (nepovinné)" className={`${input} sm:col-span-2`} />
          <input name="voiceText" placeholder="Hlasový pokyn (nepovinné)" className={`${input} sm:col-span-2`} />
        </div>
        <div className="mt-3 flex justify-end">
          <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800">
            Přidat cvik
          </button>
        </div>
      </form>

      {/* Seznam cviků */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-zinc-900">
          Cviky ({list.length})
        </h2>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Hledat…"
          className="w-48 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-zinc-500"
        />
      </div>

      <div className="mt-3 space-y-2">
        {list.length === 0 && (
          <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-400">
            Žádný cvik.
          </p>
        )}
        {list.map((ex) => (
          <ExerciseRow key={ex.id} ex={ex} run={run} />
        ))}
      </div>
    </div>
  );
}

function ExerciseRow({ ex, run }: { ex: AdminExercise; run: (fn: () => Promise<unknown>) => void }) {
  return (
    <form
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        run(() =>
          updateExercise({
            id: ex.id,
            name: String(fd.get("name") ?? ""),
            category: String(fd.get("category") ?? ""),
            coop: String(fd.get("coop") ?? "najednou"),
            defaultSec: Number(fd.get("defaultSec") ?? 180),
            spokenName: String(fd.get("spokenName") ?? ""),
            voiceText: String(fd.get("voiceText") ?? ""),
          }),
        );
      }}
      className="rounded-xl border border-zinc-200 bg-white p-3"
    >
      <div className="grid gap-2 sm:grid-cols-[1fr_140px_120px_80px]">
        <input name="name" defaultValue={ex.name} className={input} />
        <select name="category" defaultValue={ex.category ?? ""} className={input}>
          <option value="">— bez —</option>
          {CATEGORY_ORDER.map((k) => (
            <option key={k} value={k}>{CATEGORY_LABELS[k]}</option>
          ))}
        </select>
        <select name="coop" defaultValue={ex.coop ?? "najednou"} className={input}>
          {Object.entries(COOP_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <input name="defaultSec" type="number" min={5} max={1800} defaultValue={ex.defaultSec ?? 180} className={input} />
        <input name="spokenName" defaultValue={ex.spokenName ?? ""} placeholder="Mluvený název" className={`${input} sm:col-span-2`} />
        <input name="voiceText" defaultValue={ex.voiceText ?? ""} placeholder="Hlasový pokyn" className={`${input} sm:col-span-2`} />
      </div>
      <div className="mt-2 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => {
            if (confirm(`Smazat cvik „${ex.name}"?`)) run(() => deleteExercise(ex.id));
          }}
          className="text-xs text-red-600 transition hover:text-red-700"
        >
          Smazat
        </button>
        <button type="submit" className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100">
          Uložit
        </button>
      </div>
    </form>
  );
}
