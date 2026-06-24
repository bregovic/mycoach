"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, type FormEvent } from "react";
import {
  addPackageElement,
  deletePackage,
  deletePackageElement,
  movePackageElement,
  updatePackageElement,
  updatePackageMeta,
} from "@/lib/actions/packages";
import { CATEGORY_LABELS } from "@/lib/packages";

export interface PackageElementDTO {
  id: string;
  name: string;
  note: string | null;
  color: string;
  defaultIntervalDays: number;
  optional: boolean;
}
export interface PackageDTO {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  category: string | null;
  tags: string[];
  icon: string | null;
  color: string;
  isFree: boolean;
  priceCents: number | null;
  published: boolean;
  elements: PackageElementDTO[];
}

const input =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500";
const label = "block text-xs font-medium uppercase tracking-wide text-zinc-500";

export function PackageEditor({ pkg }: { pkg: PackageDTO }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      await fn();
      router.refresh();
    });

  return (
    <div className={pending ? "pointer-events-none opacity-60" : ""}>
      {/* Hlavička balíčku */}
      <form
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          run(() =>
            updatePackageMeta({
              id: pkg.id,
              title: String(fd.get("title") ?? ""),
              subtitle: String(fd.get("subtitle") ?? ""),
              description: String(fd.get("description") ?? ""),
              category: String(fd.get("category") ?? ""),
              tags: String(fd.get("tags") ?? "").split(","),
              icon: String(fd.get("icon") ?? ""),
              color: String(fd.get("color") ?? "#18181b"),
              isFree: fd.get("isFree") === "on",
              priceCzk: Number(fd.get("priceCzk") ?? 0),
              published: fd.get("published") === "on",
            }),
          );
        }}
        className="rounded-2xl border border-zinc-200 bg-white p-6"
      >
        <div className="grid gap-4 sm:grid-cols-[80px_1fr]">
          <div>
            <label className={label}>Ikona</label>
            <input name="icon" defaultValue={pkg.icon ?? ""} placeholder="💄" className={`${input} mt-1 text-center text-xl`} maxLength={4} />
          </div>
          <div>
            <label className={label}>Název</label>
            <input name="title" defaultValue={pkg.title} className={`${input} mt-1`} />
          </div>
        </div>

        <div className="mt-4">
          <label className={label}>Podtitul</label>
          <input name="subtitle" defaultValue={pkg.subtitle ?? ""} className={`${input} mt-1`} />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>Kategorie</label>
            <select name="category" defaultValue={pkg.category ?? ""} className={`${input} mt-1`}>
              <option value="">— bez —</option>
              {Object.entries(CATEGORY_LABELS).map(([slug, l]) => (
                <option key={slug} value={slug}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Barva</label>
            <input name="color" type="color" defaultValue={pkg.color} className="mt-1 h-9 w-full cursor-pointer rounded-lg border border-zinc-300 bg-white" />
          </div>
        </div>

        <div className="mt-4">
          <label className={label}>Tagy (oddělené čárkou)</label>
          <input name="tags" defaultValue={pkg.tags.join(", ")} placeholder="krasa, pece, wellness" className={`${input} mt-1`} />
        </div>

        <div className="mt-4">
          <label className={label}>Popis</label>
          <textarea name="description" defaultValue={pkg.description ?? ""} rows={4} className={`${input} mt-1 resize-y`} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" name="isFree" defaultChecked={pkg.isFree} className="h-4 w-4 rounded border-zinc-300 accent-zinc-900" />
            Zdarma
          </label>
          <div className="flex items-center gap-2">
            <label className="text-sm text-zinc-700">Cena (Kč)</label>
            <input name="priceCzk" type="number" min={0} defaultValue={pkg.priceCents != null ? Math.round(pkg.priceCents / 100) : ""} className={`${input} w-28`} />
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" name="published" defaultChecked={pkg.published} className="h-4 w-4 rounded border-zinc-300 accent-zinc-900" />
            Veřejný
          </label>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <Link href={`/balicky/${pkg.slug}`} className="text-sm text-zinc-500 transition hover:text-zinc-800">
            Zobrazit balíček →
          </Link>
          <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800">
            Uložit balíček
          </button>
        </div>
      </form>

      {/* Prvky */}
      <h2 className="mt-8 text-lg font-semibold text-zinc-900">Prvky balíčku</h2>
      <p className="mt-1 text-sm text-zinc-500">Z čeho se balíček skládá a jak často se má opakovat.</p>

      <div className="mt-4 space-y-3">
        {pkg.elements.map((el, i) => (
          <ElementCard
            key={el.id}
            el={el}
            isFirst={i === 0}
            isLast={i === pkg.elements.length - 1}
            run={run}
          />
        ))}
        {pkg.elements.length === 0 && (
          <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-400">
            Zatím žádný prvek.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => run(() => addPackageElement(pkg.id))}
        className="mt-4 w-full rounded-2xl border border-dashed border-zinc-300 bg-white py-4 text-sm font-medium text-zinc-600 transition hover:border-zinc-400 hover:bg-zinc-50"
      >
        + Přidat prvek
      </button>

      <div className="mt-8 border-t border-zinc-200 pt-6">
        <button
          type="button"
          onClick={() => {
            if (confirm("Opravdu smazat balíček? Smaže se i u odběratelů.")) {
              startTransition(() => deletePackage(pkg.id));
            }
          }}
          className="text-sm text-red-600 transition hover:text-red-700"
        >
          Smazat balíček
        </button>
      </div>
    </div>
  );
}

function ElementCard({
  el,
  isFirst,
  isLast,
  run,
}: {
  el: PackageElementDTO;
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
          updatePackageElement({
            id: el.id,
            name: String(fd.get("name") ?? ""),
            note: String(fd.get("note") ?? ""),
            color: String(fd.get("color") ?? "#18181b"),
            defaultIntervalDays: Number(fd.get("defaultIntervalDays") ?? 28),
            optional: fd.get("optional") === "on",
          }),
        );
      }}
      className="rounded-2xl border border-zinc-200 bg-white p-5"
    >
      <div className="flex items-start gap-3">
        <div className="flex flex-col gap-0.5 pt-1">
          <button type="button" disabled={isFirst} onClick={() => run(() => movePackageElement(el.id, "up"))} className="text-zinc-400 transition enabled:hover:text-zinc-700 disabled:opacity-30" aria-label="Nahoru">
            ▲
          </button>
          <button type="button" disabled={isLast} onClick={() => run(() => movePackageElement(el.id, "down"))} className="text-zinc-400 transition enabled:hover:text-zinc-700 disabled:opacity-30" aria-label="Dolů">
            ▼
          </button>
        </div>
        <div className="grid flex-1 gap-3 sm:grid-cols-[1fr_70px]">
          <div>
            <label className={label}>Název prvku</label>
            <input name="name" defaultValue={el.name} className={`${input} mt-1`} />
          </div>
          <div>
            <label className={label}>Barva</label>
            <input name="color" type="color" defaultValue={el.color} className="mt-1 h-9 w-full cursor-pointer rounded-lg border border-zinc-300 bg-white" />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Popis (nepovinné)</label>
            <input name="note" defaultValue={el.note ?? ""} className={`${input} mt-1`} />
          </div>
          <div>
            <label className={label}>Frekvence (dní)</label>
            <input name="defaultIntervalDays" type="number" min={1} max={365} defaultValue={el.defaultIntervalDays} className={`${input} mt-1`} />
          </div>
          <label className="flex items-end gap-2 pb-2 text-sm text-zinc-700">
            <input type="checkbox" name="optional" defaultChecked={el.optional} className="h-4 w-4 rounded border-zinc-300 accent-zinc-900" />
            Volitelný
          </label>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-3">
        <button type="button" onClick={() => run(() => deletePackageElement(el.id))} className="text-xs text-red-600 transition hover:text-red-700">
          Smazat
        </button>
        <button type="submit" className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100">
          Uložit prvek
        </button>
      </div>
    </form>
  );
}
