"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { subscribeToPackage, unsubscribePackage } from "@/lib/actions/packages";

export interface ElementView {
  id: string;
  name: string;
  note: string | null;
  color: string;
  defaultIntervalDays: number;
  optional: boolean;
}

export interface ExistingRow {
  elementId: string | null;
  name: string;
  color: string;
  enabled: boolean;
  intervalDays: number;
}

export interface PresetView {
  id: string;
  name: string;
  note: string | null;
  color: string;
  defaultIntervalDays: number;
}

type Row = {
  key: string;
  elementId: string | null; // odkaz na prvek šablony; null = vlastní (z nabídky)
  name: string;
  color: string;
  note: string | null;
  optional: boolean;
  enabled: boolean;
  intervalDays: number;
  custom: boolean;
};

function intervalLabel(days: number): string {
  if (days % 7 === 0) {
    const w = days / 7;
    return w === 1 ? "týdně" : `po ${w} týdnech`;
  }
  return days === 1 ? "denně" : `po ${days} dnech`;
}

export function PackageSubscribe({
  packageId,
  elements,
  existing,
  presets,
}: {
  packageId: string;
  elements: ElementView[];
  existing: ExistingRow[] | null;
  presets: PresetView[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const initial = useMemo<Row[]>(() => {
    if (existing) {
      const tplById = new Map(elements.map((e) => [e.id, e]));
      return existing.map((e, i) => {
        const tpl = e.elementId ? tplById.get(e.elementId) : undefined;
        return {
          key: `e${i}`,
          elementId: e.elementId,
          name: e.name,
          color: e.color,
          note: tpl?.note ?? null,
          optional: tpl ? tpl.optional : true,
          enabled: e.enabled,
          intervalDays: e.intervalDays,
          custom: !e.elementId,
        };
      });
    }
    return elements.map((el, i) => ({
      key: `t${i}`,
      elementId: el.id,
      name: el.name,
      color: el.color,
      note: el.note,
      optional: el.optional,
      enabled: true,
      intervalDays: el.defaultIntervalDays,
      custom: false,
    }));
  }, [elements, existing]);

  const [rows, setRows] = useState<Row[]>(initial);
  const [seq, setSeq] = useState(0);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const isSubscribed = existing !== null;

  const patch = (key: string, p: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...p } : r)));
  const removeRow = (key: string) => setRows((rs) => rs.filter((r) => r.key !== key));

  function addPreset(p: PresetView) {
    const key = `c${seq}`;
    setSeq((s) => s + 1);
    setRows((rs) => [
      ...rs,
      {
        key,
        elementId: null,
        name: p.name,
        color: p.color,
        note: p.note,
        optional: true,
        enabled: true,
        intervalDays: p.defaultIntervalDays,
        custom: true,
      },
    ]);
    setLookupOpen(false);
    setFilter("");
  }

  const confirm = () => {
    const selections = rows.map((r) => ({
      elementId: r.elementId ?? "",
      name: r.name,
      color: r.color,
      enabled: r.optional ? r.enabled : true,
      intervalDays: r.intervalDays,
    }));
    startTransition(async () => {
      await subscribeToPackage(packageId, selections);
      router.refresh();
    });
  };

  const cancel = () => {
    if (typeof window !== "undefined" && !window.confirm("Opravdu zrušit odběr? Vygenerované události se z kalendáře odeberou.")) return;
    startTransition(async () => {
      await unsubscribePackage(packageId);
      router.refresh();
    });
  };

  const enabledCount = rows.filter((r) => !r.optional || r.enabled).length;
  const filtered = presets.filter((p) => p.name.toLowerCase().includes(filter.trim().toLowerCase()));

  return (
    <div className={pending ? "pointer-events-none opacity-60" : ""}>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-900">Co chci odebírat</h2>
        {isSubscribed && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" /> Aktivní odběr
          </span>
        )}
      </div>

      <ul className="mt-4 space-y-2">
        {rows.map((row) => {
          const on = row.optional ? row.enabled : true;
          return (
            <li
              key={row.key}
              className={`rounded-xl border p-4 transition ${
                on ? "border-zinc-200 bg-white" : "border-zinc-200 bg-zinc-50/60 opacity-70"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={on}
                  disabled={!row.optional}
                  onChange={(e) => patch(row.key, { enabled: e.target.checked })}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-zinc-300 accent-zinc-900 disabled:opacity-40"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: row.color }} />
                    <span className="font-medium text-zinc-900">{row.name}</span>
                    {!row.optional && (
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                        základ
                      </span>
                    )}
                    {row.custom && (
                      <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-blue-600">
                        vlastní
                      </span>
                    )}
                  </div>
                  {row.note && <p className="mt-1 text-sm text-zinc-500">{row.note}</p>}

                  <div className="mt-3 flex items-center gap-2">
                    <label className="text-xs text-zinc-500">Frekvence</label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={row.intervalDays}
                      disabled={!on}
                      onChange={(e) => patch(row.key, { intervalDays: Number(e.target.value) || 1 })}
                      className="w-20 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 disabled:bg-zinc-100"
                    />
                    <span className="text-xs text-zinc-500">dní → {intervalLabel(row.intervalDays)}</span>
                  </div>
                </div>

                {row.custom && (
                  <button
                    type="button"
                    onClick={() => removeRow(row.key)}
                    className="shrink-0 text-xs text-red-600 transition hover:text-red-700"
                  >
                    Odebrat
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {/* Přidání z nabídky (lookup) */}
      <div className="mt-3">
        {lookupOpen ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-3">
            <input
              autoFocus
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Hledat v nabídce (kadeřník, masáž, zubař…)"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500"
            />
            <div className="mt-2 max-h-56 space-y-1 overflow-auto">
              {filtered.length === 0 ? (
                <p className="px-1 py-2 text-sm text-zinc-400">Nic nenalezeno.</p>
              ) : (
                filtered.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addPreset(p)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition hover:bg-zinc-100"
                  >
                    <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: p.color }} />
                    <span className="font-medium text-zinc-800">{p.name}</span>
                    <span className="text-xs text-zinc-400">· {intervalLabel(p.defaultIntervalDays)}</span>
                    {p.note && <span className="truncate text-xs text-zinc-400">— {p.note}</span>}
                  </button>
                ))
              )}
            </div>
            <button
              type="button"
              onClick={() => { setLookupOpen(false); setFilter(""); }}
              className="mt-2 text-xs text-zinc-500 transition hover:text-zinc-800"
            >
              Zavřít
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setLookupOpen(true)}
            className="w-full rounded-xl border border-dashed border-zinc-300 py-3 text-sm font-medium text-zinc-600 transition hover:border-zinc-400 hover:bg-zinc-50"
          >
            + Přidat prvek z nabídky
          </button>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <p className="text-sm text-zinc-500">
          Do kalendáře se zařadí <strong className="text-zinc-700">{enabledCount}</strong> z{" "}
          {rows.length}.
        </p>
        <div className="flex items-center gap-3">
          {isSubscribed && (
            <button type="button" onClick={cancel} className="text-sm text-red-600 transition hover:text-red-700">
              Zrušit odběr
            </button>
          )}
          <button
            type="button"
            onClick={confirm}
            disabled={enabledCount === 0}
            className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-40"
          >
            {isSubscribed ? "Uložit změny" : "Potvrdit odběr"}
          </button>
        </div>
      </div>
    </div>
  );
}
