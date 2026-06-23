"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, type FormEvent } from "react";
import {
  addBlock,
  addItem,
  deleteBlock,
  deleteItem,
  deleteTraining,
  moveBlock,
  moveItem,
  updateBlock,
  updateItem,
  updateTrainingMeta,
} from "@/lib/actions/trainings";
import { compileTraining } from "@/lib/trainer/compile";
import { workoutTotals, formatTime } from "@/lib/trainer/generate";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/trainer/types";

export interface ItemDTO {
  id: string;
  name: string;
  spokenName: string | null;
  voiceText: string | null;
  coop: string | null;
  durationSec: number;
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
  title: string;
  description: string | null;
  sportSlug: string | null;
  prepareSec: number;
  blocks: BlockDTO[];
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

export function TrainingEditor({ training }: { training: TrainingDTO }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      await fn();
      router.refresh();
    });

  const totals = workoutTotals(
    compileTraining({
      title: training.title,
      prepareSec: training.prepareSec,
      blocks: training.blocks,
    }),
  );

  return (
    <div className={pending ? "pointer-events-none opacity-60" : ""}>
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
              prepareSec: Number(fd.get("prepareSec") ?? 10),
            }),
          );
        }}
        className="rounded-2xl border border-zinc-200 bg-white p-6"
      >
        <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
          <div>
            <label className={label}>Název tréninku</label>
            <input name="title" defaultValue={training.title} className={`${input} mt-1`} />
          </div>
          <div>
            <label className={label}>Sport</label>
            <input
              name="sportSlug"
              defaultValue={training.sportSlug ?? ""}
              placeholder="box"
              className={`${input} mt-1`}
            />
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_140px]">
          <div>
            <label className={label}>Popis (nepovinné)</label>
            <input
              name="description"
              defaultValue={training.description ?? ""}
              className={`${input} mt-1`}
            />
          </div>
          <div>
            <label className={label}>Příprava (s)</label>
            <input
              name="prepareSec"
              type="number"
              min={0}
              max={120}
              defaultValue={training.prepareSec}
              className={`${input} mt-1`}
            />
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            Celkem <strong className="text-zinc-800">{formatTime(totals.totalSec)}</strong> ·{" "}
            {totals.rounds} kol
          </p>
          <button
            type="submit"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
          >
            Uložit
          </button>
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

      {/* Spodní akce */}
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
  run,
}: {
  block: BlockDTO;
  isFirst: boolean;
  isLast: boolean;
  run: (fn: () => Promise<unknown>) => void;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
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
            <button
              type="button"
              disabled={isFirst}
              onClick={() => run(() => moveBlock(block.id, "up"))}
              className="text-zinc-400 transition enabled:hover:text-zinc-700 disabled:opacity-30"
              aria-label="Posunout nahoru"
            >
              ▲
            </button>
            <button
              type="button"
              disabled={isLast}
              onClick={() => run(() => moveBlock(block.id, "down"))}
              className="text-zinc-400 transition enabled:hover:text-zinc-700 disabled:opacity-30"
              aria-label="Posunout dolů"
            >
              ▼
            </button>
          </div>
          <div className="flex-1">
            <input
              name="title"
              defaultValue={block.title}
              className="w-full rounded-lg border border-transparent bg-transparent px-1 py-1 text-lg font-medium text-zinc-900 outline-none transition hover:border-zinc-200 focus:border-zinc-400"
            />
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <label className={label}>Kategorie</label>
                <select name="category" defaultValue={block.category ?? ""} className={`${input} mt-1`}>
                  <option value="">— bez —</option>
                  {CATEGORY_ORDER.map((k) => (
                    <option key={k} value={k}>
                      {CATEGORY_LABELS[k]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label}>Kol (opakování)</label>
                <input
                  name="rounds"
                  type="number"
                  min={1}
                  max={50}
                  defaultValue={block.rounds}
                  className={`${input} mt-1`}
                />
              </div>
              <div>
                <label className={label}>Pauza mezi koly (s)</label>
                <input
                  name="restSec"
                  type="number"
                  min={0}
                  max={600}
                  defaultValue={block.restSec}
                  className={`${input} mt-1`}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              if (confirm("Smazat blok i s cviky?")) run(() => deleteBlock(block.id));
            }}
            className="text-xs text-red-600 transition hover:text-red-700"
          >
            Smazat blok
          </button>
          <button
            type="submit"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
          >
            Uložit blok
          </button>
        </div>
      </form>

      {/* Cviky v bloku */}
      <div className="mt-4 space-y-2 border-t border-zinc-100 pt-4">
        {block.items.map((item, j) => (
          <ItemRow
            key={item.id}
            item={item}
            isFirst={j === 0}
            isLast={j === block.items.length - 1}
            run={run}
          />
        ))}
        {block.items.length === 0 && (
          <p className="px-1 py-2 text-sm text-zinc-400">Blok zatím nemá žádný cvik.</p>
        )}
      </div>

      <button
        type="button"
        onClick={() => run(() => addItem(block.id))}
        className="mt-3 w-full rounded-lg border border-dashed border-zinc-300 py-2 text-xs font-medium text-zinc-600 transition hover:border-zinc-400 hover:bg-zinc-50"
      >
        + Přidat cvik
      </button>
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
  return (
    <form
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
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
      className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-3"
    >
      <div className="flex items-start gap-2">
        <div className="flex flex-col gap-0.5 pt-1.5 text-xs">
          <button
            type="button"
            disabled={isFirst}
            onClick={() => run(() => moveItem(item.id, "up"))}
            className="text-zinc-400 transition enabled:hover:text-zinc-700 disabled:opacity-30"
            aria-label="Posunout nahoru"
          >
            ▲
          </button>
          <button
            type="button"
            disabled={isLast}
            onClick={() => run(() => moveItem(item.id, "down"))}
            className="text-zinc-400 transition enabled:hover:text-zinc-700 disabled:opacity-30"
            aria-label="Posunout dolů"
          >
            ▼
          </button>
        </div>
        <div className="grid flex-1 gap-2 sm:grid-cols-[1fr_110px_130px]">
          <input name="name" defaultValue={item.name} placeholder="Název cviku" className={input} />
          <input
            name="durationSec"
            type="number"
            min={5}
            max={1800}
            defaultValue={item.durationSec}
            className={input}
            aria-label="Délka (s)"
          />
          <select name="coop" defaultValue={item.coop ?? "najednou"} className={input}>
            {Object.entries(COOP_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <input
            name="spokenName"
            defaultValue={item.spokenName ?? ""}
            placeholder="Mluvený název (nepovinné)"
            className={`${input} sm:col-span-1`}
          />
          <input
            name="voiceText"
            defaultValue={item.voiceText ?? ""}
            placeholder="Hlasový pokyn (nepovinné)"
            className={`${input} sm:col-span-2`}
          />
        </div>
      </div>
      <div className="mt-2 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => run(() => deleteItem(item.id))}
          className="text-xs text-red-600 transition hover:text-red-700"
        >
          Smazat
        </button>
        <button
          type="submit"
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
        >
          Uložit cvik
        </button>
      </div>
    </form>
  );
}
