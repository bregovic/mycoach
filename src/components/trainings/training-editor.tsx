"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition, type FormEvent } from "react";
import {
  addBlock,
  addItem,
  addItemFromExercise,
  deleteBlock,
  deleteItem,
  deleteTraining,
  moveBlock,
  moveItem,
  updateBlock,
  updateItem,
  updateTrainingImage,
  updateTrainingMeta,
  uploadItemAudio,
  removeItemAudio,
} from "@/lib/actions/trainings";
import { compileTraining } from "@/lib/trainer/compile";
import { workoutTotals, formatTime } from "@/lib/trainer/generate";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/trainer/types";
import { DIFFICULTY_LABELS, DIFFICULTY_ORDER } from "@/lib/training-meta";
import { createExercise } from "@/lib/actions/exercises";
import { ImageUpload } from "@/components/image-upload";

export interface ItemDTO {
  id: string;
  name: string;
  spokenName: string | null;
  voiceText: string | null;
  coop: string | null;
  durationSec: number;
  exerciseId: string | null;
  audioKey: string | null;
}
export interface BlockDTO {
  id: string;
  title: string;
  category: string | null;
  rounds: number;
  restSec: number;
  items: ItemDTO[];
}
export interface TrainingDTO {
  id: string;
  number: number;
  title: string;
  description: string | null;
  sportSlug: string | null;
  difficulty: string | null;
  imageUrl: string | null;
  targetMin: number | null;
  isPublic: boolean;
  prepareSec: number;
  blocks: BlockDTO[];
}
export interface SportDTO {
  slug: string;
  name: string;
  icon: string | null;
}
export interface ExerciseDTO {
  id: string;
  name: string;
  spokenName: string | null;
  category: string | null;
  coop: string | null;
  defaultSec: number | null;
  sportSlug: string;
  isPrivate: boolean;
  mine: boolean;
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

export function TrainingEditor({
  training,
  sports,
  exercises,
}: {
  training: TrainingDTO;
  sports: SportDTO[];
  exercises: ExerciseDTO[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      await fn();
      router.refresh();
    });

  const totals = workoutTotals(
    compileTraining({ title: training.title, prepareSec: training.prepareSec, blocks: training.blocks }),
  );

  const sportExercises = useMemo(
    () => exercises.filter((e) => e.sportSlug === (training.sportSlug ?? "box")),
    [exercises, training.sportSlug],
  );

  return (
    <div className={pending ? "pointer-events-none opacity-60" : ""}>
      <div className="mb-3 flex items-center gap-2 text-sm text-zinc-400">
        <span className="rounded-md bg-zinc-200/70 px-2 py-0.5 font-medium text-zinc-600">
          #{training.number}
        </span>
        {training.isPublic && (
          <span className="rounded-md bg-green-50 px-2 py-0.5 font-medium text-green-700">Veřejný</span>
        )}
      </div>

      {/* Hlavička tréninku */}
      <form
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          run(() =>
            updateTrainingMeta({
              id: training.id,
              title: String(fd.get("title") ?? ""),
              description: String(fd.get("description") ?? ""),
              sportSlug: String(fd.get("sportSlug") ?? ""),
              difficulty: String(fd.get("difficulty") ?? ""),
              targetMin: Number(fd.get("targetMin") ?? 0) || null,
              isPublic: fd.get("isPublic") === "on",
              prepareSec: Number(fd.get("prepareSec") ?? 10),
            }),
          );
        }}
        className="rounded-2xl border border-zinc-200 bg-white p-6"
      >
        <div className="flex flex-col gap-5 sm:flex-row">
          <ImageUpload
            url={training.imageUrl}
            disabled={pending}
            onPick={(dataUrl) => run(() => updateTrainingImage(training.id, dataUrl))}
            onClear={() => run(() => updateTrainingImage(training.id, null))}
          />

          <div className="flex-1 space-y-4">
            <div>
              <label className={label}>Název tréninku</label>
              <input name="title" defaultValue={training.title} className={`${input} mt-1`} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className={label}>Sport</label>
                <select name="sportSlug" defaultValue={training.sportSlug ?? "box"} className={`${input} mt-1`}>
                  {sports.length === 0 && <option value="box">Box</option>}
                  {sports.map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.icon ? `${s.icon} ` : ""}
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label}>Obtížnost</label>
                <select name="difficulty" defaultValue={training.difficulty ?? ""} className={`${input} mt-1`}>
                  <option value="">— bez —</option>
                  {DIFFICULTY_ORDER.map((d) => (
                    <option key={d} value={d}>
                      {DIFFICULTY_LABELS[d]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label}>Cílová délka (min)</label>
                <input
                  name="targetMin"
                  type="number"
                  min={1}
                  max={600}
                  defaultValue={training.targetMin ?? ""}
                  className={`${input} mt-1`}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_140px]">
          <div>
            <label className={label}>Popis (nepovinné)</label>
            <input name="description" defaultValue={training.description ?? ""} className={`${input} mt-1`} />
          </div>
          <div>
            <label className={label}>Příprava (s)</label>
            <input name="prepareSec" type="number" min={0} max={120} defaultValue={training.prepareSec} className={`${input} mt-1`} />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" name="isPublic" defaultChecked={training.isPublic} className="h-4 w-4 rounded border-zinc-300 accent-zinc-900" />
            Veřejný (najdou si ho ostatní)
          </label>
          <div className="flex items-center gap-4">
            <p className="text-sm text-zinc-500">
              Sestaveno <strong className="text-zinc-800">{formatTime(totals.totalSec)}</strong>
              {training.targetMin ? ` / cíl ${training.targetMin} min` : ""} · {totals.rounds} kol
            </p>
            <button type="submit" className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100">
              Uložit
            </button>
          </div>
        </div>
      </form>

      {/* Bloky */}
      <div className="mt-6 space-y-4">
        {training.blocks.map((block, i) => (
          <BlockCard
            key={block.id}
            block={block}
            isFirst={i === 0}
            isLast={i === training.blocks.length - 1}
            sportExercises={sportExercises}
            sportSlug={training.sportSlug ?? "box"}
            run={run}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => run(() => addBlock(training.id))}
        className="mt-4 w-full rounded-2xl border border-dashed border-zinc-300 bg-white py-4 text-sm font-medium text-zinc-600 transition hover:border-zinc-400 hover:bg-zinc-50"
      >
        + Přidat blok
      </button>

      <div className="mt-8 flex items-center justify-between border-t border-zinc-200 pt-6">
        <button
          type="button"
          onClick={() => {
            if (confirm("Opravdu smazat celý trénink?")) run(() => deleteTraining(training.id));
          }}
          className="text-sm text-red-600 transition hover:text-red-700"
        >
          Smazat trénink
        </button>
        {totals.rounds > 0 && (
          <Link
            href={`/trening/${training.id}`}
            className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            Spustit trénink →
          </Link>
        )}
      </div>
    </div>
  );
}

function BlockCard({
  block,
  isFirst,
  isLast,
  sportExercises,
  sportSlug,
  run,
}: {
  block: BlockDTO;
  isFirst: boolean;
  isLast: boolean;
  sportExercises: ExerciseDTO[];
  sportSlug: string;
  run: (fn: () => Promise<unknown>) => void;
}) {
  const router = useRouter();
  const [adding, startAdd] = useTransition();
  const [lookupOpen, setLookupOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [newPrivate, setNewPrivate] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  // Při výběru kategorie předvyplň název bloku (jen je-li prázdný/výchozí),
  // dál ho lze normálně přepsat.
  function onCategoryChange(slug: string) {
    const labels = Object.values(CATEGORY_LABELS);
    const cur = titleRef.current?.value.trim() ?? "";
    const isDefault = cur === "" || cur === "Nový blok" || labels.includes(cur);
    if (slug && isDefault && titleRef.current) {
      titleRef.current.value = CATEGORY_LABELS[slug as keyof typeof CATEGORY_LABELS] ?? cur;
    }
  }

  // Auto-uložení bloku (změna kategorie/času se projeví hned, bez tlačítka).
  function saveBlock(form: HTMLFormElement | null) {
    if (!form) return;
    const fd = new FormData(form);
    run(() =>
      updateBlock({
        id: block.id,
        title: String(fd.get("title") ?? ""),
        category: String(fd.get("category") ?? "") || null,
        rounds: Number(fd.get("rounds") ?? 1),
        restSec: Number(fd.get("restSec") ?? 60),
      }),
    );
  }

  function createInCatalog() {
    const name = filter.trim();
    if (!name) return;
    startAdd(async () => {
      await createExercise({ sportSlug, name, category: block.category ?? undefined, isPrivate: newPrivate });
      router.refresh();
    });
  }

  const inBlock = new Set(block.items.map((it) => it.exerciseId).filter(Boolean));
  const q = filter.trim().toLowerCase();
  const filtered = sportExercises
    // ukazuj jen cviky se stejnou kategorií jako blok (má-li blok kategorii)
    .filter((e) => (block.category ? e.category === block.category : true))
    .filter((e) => e.name.toLowerCase().includes(q))
    .slice(0, 40);

  function addFromCatalog(ex: ExerciseDTO) {
    setNote(null);
    setFilter(""); // po potvrzení vyčisti hledání (panel zůstává otevřený pro další)
    startAdd(async () => {
      const res = await addItemFromExercise(block.id, ex.id);
      if (!res.added) setNote(`„${ex.name}" už v bloku je.`);
      router.refresh();
    });
  }

  return (
    <div className={`rounded-2xl border border-zinc-200 bg-white p-5 ${adding ? "opacity-70" : ""}`}>
      <form
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          run(() =>
            updateBlock({
              id: block.id,
              title: String(fd.get("title") ?? ""),
              category: String(fd.get("category") ?? "") || null,
              rounds: Number(fd.get("rounds") ?? 1),
              restSec: Number(fd.get("restSec") ?? 60),
            }),
          );
        }}
      >
        <div className="flex items-start gap-2">
          <div className="flex flex-col gap-0.5 pt-1">
            <button type="button" disabled={isFirst} onClick={() => run(() => moveBlock(block.id, "up"))} className="text-zinc-400 transition enabled:hover:text-zinc-700 disabled:opacity-30" aria-label="Nahoru">▲</button>
            <button type="button" disabled={isLast} onClick={() => run(() => moveBlock(block.id, "down"))} className="text-zinc-400 transition enabled:hover:text-zinc-700 disabled:opacity-30" aria-label="Dolů">▼</button>
          </div>
          <div className="flex-1">
            <input
              ref={titleRef}
              name="title"
              defaultValue={block.title}
              onBlur={(e) => saveBlock(e.currentTarget.form)}
              className="w-full rounded-lg border border-transparent bg-transparent px-1 py-1 text-lg font-medium text-zinc-900 outline-none transition hover:border-zinc-200 focus:border-zinc-400"
            />
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <label className={label}>Kategorie</label>
                <select
                  name="category"
                  defaultValue={block.category ?? ""}
                  onChange={(e) => {
                    onCategoryChange(e.target.value);
                    saveBlock(e.currentTarget.form);
                  }}
                  className={`${input} mt-1`}
                >
                  <option value="">— bez —</option>
                  {CATEGORY_ORDER.map((k) => (
                    <option key={k} value={k}>{CATEGORY_LABELS[k]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label}>Kol (opakování)</label>
                <input name="rounds" type="number" min={1} max={50} defaultValue={block.rounds} onBlur={(e) => saveBlock(e.currentTarget.form)} className={`${input} mt-1`} />
              </div>
              <div>
                <label className={label}>Pauza mezi koly (s)</label>
                <input name="restSec" type="number" min={0} max={600} defaultValue={block.restSec} onBlur={(e) => saveBlock(e.currentTarget.form)} className={`${input} mt-1`} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-end gap-3">
          <button type="button" onClick={() => { if (confirm("Smazat blok i s cviky?")) run(() => deleteBlock(block.id)); }} className="text-xs text-red-600 transition hover:text-red-700">
            Smazat blok
          </button>
          <button type="submit" className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100">
            Uložit blok
          </button>
        </div>
      </form>

      {/* Cviky v bloku */}
      <div className="mt-4 space-y-2 border-t border-zinc-100 pt-4">
        {block.items.map((item, j) => (
          <ItemRow key={item.id} item={item} isFirst={j === 0} isLast={j === block.items.length - 1} run={run} />
        ))}
        {block.items.length === 0 && <p className="px-1 py-2 text-sm text-zinc-400">Blok zatím nemá žádný cvik.</p>}
      </div>

      {/* Přidání z číselníku + vlastní */}
      <div className="mt-3 space-y-2">
        {lookupOpen ? (
          <div className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-3">
            <input
              autoFocus
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Hledat cvik v číselníku…"
              className={input}
            />
            {q ? (
              <div className="mt-2 max-h-56 space-y-1 overflow-auto">
                {filtered.length === 0 ? (
                  <p className="px-1 py-2 text-sm text-zinc-400">Nic nenalezeno.</p>
                ) : (
                  filtered.map((e) => {
                    const already = inBlock.has(e.id);
                    return (
                      <button
                        key={e.id}
                        type="button"
                        disabled={already}
                        onClick={() => addFromCatalog(e)}
                        className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-sm transition hover:bg-white disabled:opacity-40"
                      >
                        <span className="min-w-0 truncate text-zinc-800">
                          {e.isPrivate && <span title="Soukromé">🔒 </span>}
                          {e.name}
                        </span>
                        <span className="shrink-0 text-xs text-zinc-400">
                          {e.category ? `${CATEGORY_LABELS[e.category as keyof typeof CATEGORY_LABELS] ?? e.category} · ` : ""}
                          {already ? "✓ v bloku" : `${e.defaultSec ?? 180}s`}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            ) : (
              <p className="mt-2 px-1 py-2 text-sm text-zinc-400">Začni psát název cviku…</p>
            )}
            {note && <p className="mt-1 text-xs text-amber-600">{note}</p>}
            {filter.trim() && (
              <div className="mt-2 flex items-center gap-2 border-t border-zinc-200 pt-2">
                <button
                  type="button"
                  onClick={createInCatalog}
                  className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
                >
                  + Vytvořit „{filter.trim()}"
                </button>
                <label className="flex items-center gap-1 text-xs text-zinc-500">
                  <input type="checkbox" checked={newPrivate} onChange={(e) => setNewPrivate(e.target.checked)} className="h-3.5 w-3.5 rounded border-zinc-300 accent-zinc-900" />
                  soukromé
                </label>
              </div>
            )}
            <div className="mt-2 flex items-center justify-between">
              <button type="button" onClick={() => { setLookupOpen(false); setFilter(""); setNote(null); }} className="text-xs text-zinc-500 transition hover:text-zinc-800">
                Zavřít
              </button>
              <Link href="/cviky" className="text-xs font-medium text-zinc-500 transition hover:text-zinc-800">
                Spravovat cviky →
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setLookupOpen(true)}
              className="flex-1 rounded-lg border border-dashed border-zinc-300 py-2 text-xs font-medium text-zinc-600 transition hover:border-zinc-400 hover:bg-zinc-50"
            >
              + Z číselníku ({sportExercises.length})
            </button>
            <button
              type="button"
              onClick={() => run(() => addItem(block.id))}
              className="rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-600 transition hover:border-zinc-400 hover:bg-zinc-50"
            >
              + Vlastní
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ItemRow({
  item,
  isFirst,
  isLast,
  run,
}: {
  item: ItemDTO;
  isFirst: boolean;
  isLast: boolean;
  run: (fn: () => Promise<unknown>) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <form
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setOpen(false);
        run(() =>
          updateItem({
            id: item.id,
            name: String(fd.get("name") ?? ""),
            spokenName: String(fd.get("spokenName") ?? ""),
            voiceText: String(fd.get("voiceText") ?? ""),
            coop: String(fd.get("coop") ?? "najednou"),
            durationSec: Number(fd.get("durationSec") ?? 180),
          }),
        );
      }}
      className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3 sm:p-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex flex-col gap-0.5 pt-1 text-xs">
          <button type="button" disabled={isFirst} onClick={() => run(() => moveItem(item.id, "up"))} className="text-zinc-400 transition enabled:hover:text-zinc-700 disabled:opacity-30" aria-label="Nahoru">▲</button>
          <button type="button" disabled={isLast} onClick={() => run(() => moveItem(item.id, "down"))} className="text-zinc-400 transition enabled:hover:text-zinc-700 disabled:opacity-30" aria-label="Dolů">▼</button>
        </div>

        {open ? (
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <label className={label}>Název cviku</label>
              <input name="name" defaultValue={item.name} placeholder="Název cviku" className={`${input} mt-1 text-base`} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={label}>Délka (s)</label>
                <input name="durationSec" type="number" min={5} max={1800} defaultValue={item.durationSec} className={`${input} mt-1`} />
              </div>
              <div>
                <label className={label}>Režim</label>
                <select name="coop" defaultValue={item.coop ?? "najednou"} className={`${input} mt-1`}>
                  {Object.entries(COOP_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={label}>Mluvený název</label>
              <input name="spokenName" defaultValue={item.spokenName ?? ""} placeholder="Český mluvený název (pro hlas)" className={`${input} mt-1`} />
            </div>
            <div>
              <label className={label}>Hlasový pokyn</label>
              <input name="voiceText" defaultValue={item.voiceText ?? ""} placeholder="Detailní pokyn čtený v přehrávači" className={`${input} mt-1`} />
            </div>
            <div className="rounded-lg bg-white p-2">
              <span className={label}>MP3 instrukce (přehraje se místo čtení)</span>
              {item.audioKey ? (
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                  <audio controls src={`/api/exercise-audio?key=${encodeURIComponent(item.audioKey)}`} className="h-8 max-w-full" />
                  <button type="button" onClick={() => run(() => removeItemAudio(item.id))} className="text-xs text-red-600 transition hover:text-red-700">Odebrat MP3</button>
                </div>
              ) : (
                <label className="mt-1 inline-flex cursor-pointer items-center rounded-lg border border-dashed border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-zinc-400 hover:bg-zinc-50">
                  + Nahrát MP3
                  <input
                    type="file"
                    accept="audio/mpeg,.mp3"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (!f) return;
                      const fd = new FormData();
                      fd.set("itemId", item.id);
                      fd.set("file", f);
                      run(() => uploadItemAudio(fd));
                    }}
                  />
                </label>
              )}
            </div>
            <div className="flex items-center justify-end gap-3">
              <button type="button" onClick={() => setOpen(false)} className="text-xs text-zinc-500 transition hover:text-zinc-800">Zavřít</button>
              <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-zinc-800">Uložit cvik</button>
            </div>
          </div>
        ) : (
          <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-base font-medium text-zinc-900">{item.name}</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {item.durationSec}s · {COOP_LABELS[item.coop ?? "najednou"] ?? "Najednou"}
                {item.exerciseId ? " · z číselníku" : ""}
                {item.audioKey ? " · 🔊 MP3" : ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <button type="button" onClick={() => run(() => deleteItem(item.id))} className="text-xs text-red-600 transition hover:text-red-700">Smazat</button>
              <button type="button" onClick={() => setOpen(true)} className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100">Upravit</button>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
