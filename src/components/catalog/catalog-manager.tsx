"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  createExercise,
  createPreset,
  createSport,
  deleteExercise,
  deletePreset,
  removeExerciseAudio,
  updateExercise,
  updatePreset,
  updateSportImage,
  uploadExerciseAudio,
} from "@/lib/actions/exercises";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/trainer/types";
import { ImageUpload } from "@/components/image-upload";

export interface CatSport {
  slug: string;
  name: string;
  icon: string | null;
  imageUrl: string | null;
}
export interface CatExercise {
  id: string;
  name: string;
  category: string | null;
  coop: string | null;
  defaultSec: number | null;
  spokenName: string | null;
  voiceText: string | null;
  isPrivate: boolean;
  audioKey: string | null;
  sportSlug: string;
  mine: boolean;
}
export interface CatPreset {
  id: string;
  name: string;
  note: string | null;
  color: string;
  defaultIntervalDays: number;
  category: string | null;
}

const COOP_LABELS: Record<string, string> = {
  najednou: "Najednou",
  stridave: "Střídavě",
  v_pulce: "Výměna v půlce",
  cele_kolo: "Celé kolo",
};
const input = "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500";
const label = "block text-xs font-medium uppercase tracking-wide text-zinc-500";

function audioSrc(key: string): string {
  return `/api/exercise-audio?key=${encodeURIComponent(key)}`;
}

function SportThumb({ sport, size = 56 }: { sport: CatSport | null; size?: number }) {
  if (sport?.imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- data URL
    return <img src={sport.imageUrl} alt="" style={{ width: size, height: size }} className="shrink-0 rounded-xl object-cover ring-1 ring-zinc-200" />;
  }
  return (
    <span style={{ width: size, height: size }} className="flex shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-lg font-semibold text-zinc-500 ring-1 ring-zinc-200">
      {(sport?.name ?? "?").slice(0, 1).toUpperCase()}
    </span>
  );
}

export function CatalogManager({
  sports,
  exercises,
  presets,
  isAdmin,
}: {
  sports: CatSport[];
  exercises: CatExercise[];
  presets: CatPreset[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<"cviky" | "prvky">("cviky");
  const [sport, setSport] = useState(sports[0]?.slug ?? "");
  const [category, setCategory] = useState("");
  const [mineOnly, setMineOnly] = useState(false);
  const [filter, setFilter] = useState("");
  const [editSport, setEditSport] = useState(false);

  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      await fn();
      router.refresh();
    });

  // MP3 řešíme bez router.refresh (jinak by se ztratil fokus/scroll/filtry).
  const [audioOverride, setAudioOverride] = useState<Record<string, string | null>>({});
  function uploadAudio(exId: string, file: File) {
    const fd = new FormData();
    fd.set("exerciseId", exId);
    fd.set("file", file);
    startTransition(async () => {
      const key = await uploadExerciseAudio(fd);
      setAudioOverride((o) => ({ ...o, [exId]: key }));
    });
  }
  function removeAudio(exId: string) {
    startTransition(async () => {
      await removeExerciseAudio(exId);
      setAudioOverride((o) => ({ ...o, [exId]: null }));
    });
  }

  const q = filter.trim().toLowerCase();
  const list = useMemo(
    () =>
      exercises.filter(
        (e) =>
          e.sportSlug === sport &&
          (!category || e.category === category) &&
          (!mineOnly || e.mine) &&
          e.name.toLowerCase().includes(q),
      ),
    [exercises, sport, category, mineOnly, q],
  );
  const currentSport = sports.find((s) => s.slug === sport) ?? null;

  return (
    <div className={pending ? "pointer-events-none opacity-60" : ""}>
      {/* Záložky */}
      <div className="flex gap-1 border-b border-zinc-200">
        <TabButton active={tab === "cviky"} onClick={() => setTab("cviky")}>Cviky</TabButton>
        {isAdmin && (
          <TabButton active={tab === "prvky"} onClick={() => setTab("prvky")}>Prvky balíčků</TabButton>
        )}
      </div>

      {tab === "cviky" && (
        <>
          {/* Filtry */}
          <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-end gap-3">
              <SportThumb sport={currentSport} />
              <div className="min-w-[9rem] flex-1">
                <label className={label}>Sport</label>
                <select value={sport} onChange={(e) => setSport(e.target.value)} className={`${input} mt-1`}>
                  {sports.length === 0 && <option value="">— žádný sport —</option>}
                  {sports.map((s) => (
                    <option key={s.slug} value={s.slug}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="min-w-[8rem]">
                <label className={label}>Kategorie</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${input} mt-1`}>
                  <option value="">Všechny</option>
                  {CATEGORY_ORDER.map((k) => (
                    <option key={k} value={k}>{CATEGORY_LABELS[k]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Hledat cvik…" className="min-w-[10rem] flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500" />
              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input type="checkbox" checked={mineOnly} onChange={(e) => setMineOnly(e.target.checked)} className="h-4 w-4 rounded border-zinc-300 accent-zinc-900" />
                Jen moje cviky
              </label>
              {isAdmin && (
                <button type="button" onClick={() => setEditSport((v) => !v)} className="text-sm font-medium text-zinc-500 transition hover:text-zinc-800">
                  {editSport ? "Hotovo" : "Upravit sport"}
                </button>
              )}
            </div>

            {/* Editace sportu (jen admin, jen v režimu úprav) */}
            {isAdmin && editSport && (
              <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-zinc-100 pt-4">
                {currentSport && (
                  <div>
                    <span className={label}>Fotka sportu</span>
                    <div className="mt-1">
                      <ImageUpload
                        size={64}
                        url={currentSport.imageUrl}
                        disabled={pending}
                        placeholder={<span className="text-sm text-zinc-400">Foto</span>}
                        onPick={(d) => run(() => updateSportImage(currentSport.slug, d))}
                        onClear={() => run(() => updateSportImage(currentSport.slug, null))}
                      />
                    </div>
                  </div>
                )}
                <form
                  onSubmit={(e: FormEvent<HTMLFormElement>) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    const name = String(fd.get("name") ?? "").trim();
                    if (!name) return;
                    run(() => createSport({ name }));
                    e.currentTarget.reset();
                  }}
                  className="flex items-end gap-2"
                >
                  <div>
                    <span className={label}>Nový sport</span>
                    <input name="name" placeholder="Název sportu" className={`${input} mt-1 w-44`} />
                  </div>
                  <button type="submit" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100">Přidat</button>
                </form>
              </div>
            )}
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
                  isPrivate: fd.get("isPrivate") === "on",
                }),
              );
              e.currentTarget.reset();
            }}
            className="mt-5 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5"
          >
            <h2 className="text-base font-semibold text-zinc-900">Přidat cvik</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_150px_120px_90px]">
              <div>
                <label className={label}>Název</label>
                <input name="name" className={`${input} mt-1`} />
              </div>
              <div>
                <label className={label}>Kategorie</label>
                <select name="category" defaultValue={category} className={`${input} mt-1`}>
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
            <div className="mt-3 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input type="checkbox" name="isPrivate" className="h-4 w-4 rounded border-zinc-300 accent-zinc-900" />
                Soukromé (nenabízí se ostatním)
              </label>
              <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800">Přidat cvik</button>
            </div>
          </form>

          {/* Seznam cviků */}
          <h2 className="mt-6 text-base font-semibold text-zinc-900">Cviky ({list.length})</h2>
          <div className="mt-3 space-y-2">
            {list.length === 0 && <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-400">Žádný cvik.</p>}
            {list.map((ex) => (
              <ExerciseRow
                key={ex.id}
                ex={ex}
                isAdmin={isAdmin}
                audioKey={ex.id in audioOverride ? audioOverride[ex.id] : ex.audioKey}
                onUploadAudio={(f) => uploadAudio(ex.id, f)}
                onRemoveAudio={() => removeAudio(ex.id)}
                run={run}
              />
            ))}
          </div>
        </>
      )}

      {tab === "prvky" && isAdmin && (
        <div className="mt-4">
          <p className="text-sm text-zinc-500">Katalog prvků, ze kterého si uživatelé přidávají do odběru balíčku.</p>
          <PresetAdd run={run} />
          <div className="mt-3 space-y-2">
            {presets.map((p) => (
              <PresetRow key={p.id} p={p} run={run} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition ${active ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-800"}`}
    >
      {children}
    </button>
  );
}

function ExerciseRow({
  ex,
  isAdmin,
  audioKey,
  onUploadAudio,
  onRemoveAudio,
  run,
}: {
  ex: CatExercise;
  isAdmin: boolean;
  audioKey: string | null;
  onUploadAudio: (file: File) => void;
  onRemoveAudio: () => void;
  run: (fn: () => Promise<unknown>) => void;
}) {
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
            isPrivate: fd.get("isPrivate") === "on",
          }),
        );
      }}
      className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className={`rounded px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${ex.mine ? "bg-blue-50 text-blue-600" : "bg-zinc-100 text-zinc-500"}`}>
          {ex.mine ? "vlastní" : "veřejné"}
        </span>
        {ex.isPrivate && <span className="rounded bg-amber-50 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-amber-700">soukromé</span>}
        {audioKey && <span className="rounded bg-green-50 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-green-700">🔊 MP3</span>}
      </div>
      <div className="space-y-3">
        <div>
          <label className={label}>Název cviku</label>
          <input name="name" defaultValue={ex.name} className={`${input} mt-1 text-base`} />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className={label}>Kategorie</label>
            <select name="category" defaultValue={ex.category ?? ""} className={`${input} mt-1`}>
              <option value="">— bez —</option>
              {CATEGORY_ORDER.map((k) => (
                <option key={k} value={k}>{CATEGORY_LABELS[k]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Režim</label>
            <select name="coop" defaultValue={ex.coop ?? "najednou"} className={`${input} mt-1`}>
              {Object.entries(COOP_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Délka (s)</label>
            <input name="defaultSec" type="number" min={5} max={1800} defaultValue={ex.defaultSec ?? 180} className={`${input} mt-1`} />
          </div>
        </div>
        <div>
          <label className={label}>Mluvený název</label>
          <input name="spokenName" defaultValue={ex.spokenName ?? ""} placeholder="Český mluvený název (pro hlas)" className={`${input} mt-1`} />
        </div>
        <div>
          <label className={label}>Hlasový pokyn</label>
          <input name="voiceText" defaultValue={ex.voiceText ?? ""} placeholder="Detailní pokyn čtený v přehrávači" className={`${input} mt-1`} />
        </div>

        {/* MP3 instrukce */}
        <div className="rounded-lg bg-zinc-50 p-3">
          <span className={label}>MP3 instrukce (přehraje se místo čtení)</span>
          {audioKey ? (
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <audio controls src={audioSrc(audioKey)} className="h-9 max-w-full" />
              <button type="button" onClick={onRemoveAudio} className="text-xs text-red-600 transition hover:text-red-700">
                Odebrat MP3
              </button>
            </div>
          ) : (
            <label className="mt-2 inline-flex cursor-pointer items-center rounded-lg border border-dashed border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-zinc-400 hover:bg-white">
              + Nahrát MP3
              <input
                type="file"
                accept="audio/mpeg,.mp3"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) onUploadAudio(f);
                }}
              />
            </label>
          )}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-zinc-600">
          <input type="checkbox" name="isPrivate" defaultChecked={ex.isPrivate} className="h-3.5 w-3.5 rounded border-zinc-300 accent-zinc-900" />
          soukromé
        </label>
        <div className="flex items-center gap-3">
          {(ex.mine || isAdmin) && (
            <button type="button" onClick={() => { if (confirm(`Smazat cvik „${ex.name}"?`)) run(() => deleteExercise(ex.id)); }} className="text-xs text-red-600 transition hover:text-red-700">
              Smazat
            </button>
          )}
          <button type="submit" className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100">
            Uložit
          </button>
        </div>
      </div>
    </form>
  );
}

function PresetAdd({ run }: { run: (fn: () => Promise<unknown>) => void }) {
  return (
    <form
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const name = String(fd.get("name") ?? "").trim();
        if (!name) return;
        run(() =>
          createPreset({
            name,
            note: String(fd.get("note") ?? ""),
            color: String(fd.get("color") ?? "#18181b"),
            defaultIntervalDays: Number(fd.get("days") ?? 28),
            category: String(fd.get("category") ?? ""),
          }),
        );
        e.currentTarget.reset();
      }}
      className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-4"
    >
      <input name="color" type="color" defaultValue="#18181b" className="h-9 w-9 cursor-pointer rounded-lg border border-zinc-300" />
      <input name="name" placeholder="Název prvku" className="w-40 rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
      <input name="days" type="number" min={1} max={365} defaultValue={28} className="w-20 rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
      <input name="category" placeholder="kategorie" className="w-28 rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
      <input name="note" placeholder="Popis" className="min-w-[8rem] flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
      <button type="submit" className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800">+ Prvek</button>
    </form>
  );
}

function PresetRow({ p, run }: { p: CatPreset; run: (fn: () => Promise<unknown>) => void }) {
  return (
    <form
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        run(() =>
          updatePreset({
            id: p.id,
            name: String(fd.get("name") ?? ""),
            note: String(fd.get("note") ?? ""),
            color: String(fd.get("color") ?? "#18181b"),
            defaultIntervalDays: Number(fd.get("days") ?? 28),
            category: String(fd.get("category") ?? ""),
          }),
        );
      }}
      className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-white p-3"
    >
      <input name="color" type="color" defaultValue={p.color} className="h-8 w-8 cursor-pointer rounded-lg border border-zinc-300" />
      <input name="name" defaultValue={p.name} className="w-36 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
      <input name="days" type="number" min={1} max={365} defaultValue={p.defaultIntervalDays} className="w-16 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
      <input name="category" defaultValue={p.category ?? ""} placeholder="kategorie" className="w-24 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
      <input name="note" defaultValue={p.note ?? ""} placeholder="Popis" className="min-w-[6rem] flex-1 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
      <button type="submit" className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100">Uložit</button>
      <button type="button" onClick={() => run(() => deletePreset(p.id))} className="text-xs text-red-600 transition hover:text-red-700">Smazat</button>
    </form>
  );
}
