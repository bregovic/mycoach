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

export interface ExistingSelection {
  elementId: string | null;
  enabled: boolean;
  intervalDays: number;
}

type Row = { enabled: boolean; intervalDays: number };

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
}: {
  packageId: string;
  elements: ElementView[];
  existing: ExistingSelection[] | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const initial = useMemo<Record<string, Row>>(() => {
    const byElement = new Map(existing?.map((e) => [e.elementId, e] as const));
    const out: Record<string, Row> = {};
    for (const el of elements) {
      const prev = byElement.get(el.id);
      out[el.id] = {
        enabled: prev ? prev.enabled : true,
        intervalDays: prev ? prev.intervalDays : el.defaultIntervalDays,
      };
    }
    return out;
  }, [elements, existing]);

  const [rows, setRows] = useState<Record<string, Row>>(initial);
  const isSubscribed = existing !== null;

  const setRow = (id: string, patch: Partial<Row>) =>
    setRows((r) => ({ ...r, [id]: { ...r[id], ...patch } }));

  const confirm = () => {
    const selections = elements.map((el) => ({
      elementId: el.id,
      name: el.name,
      color: el.color,
      enabled: el.optional ? rows[el.id].enabled : true,
      intervalDays: rows[el.id].intervalDays,
    }));
    startTransition(async () => {
      await subscribeToPackage(packageId, selections);
      router.refresh();
    });
  };

  const cancel = () => {
    if (!confirmWindow("Opravdu zrušit odběr? Vygenerované události se z kalendáře odeberou.")) return;
    startTransition(async () => {
      await unsubscribePackage(packageId);
      router.refresh();
    });
  };

  const enabledCount = elements.filter((el) => !el.optional || rows[el.id].enabled).length;

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
        {elements.map((el) => {
          const row = rows[el.id];
          const on = el.optional ? row.enabled : true;
          return (
            <li
              key={el.id}
              className={`rounded-xl border p-4 transition ${
                on ? "border-zinc-200 bg-white" : "border-zinc-200 bg-zinc-50/60 opacity-70"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={on}
                  disabled={!el.optional}
                  onChange={(e) => setRow(el.id, { enabled: e.target.checked })}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-zinc-300 accent-zinc-900 disabled:opacity-40"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: el.color }} />
                    <span className="font-medium text-zinc-900">{el.name}</span>
                    {!el.optional && (
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                        základ
                      </span>
                    )}
                  </div>
                  {el.note && <p className="mt-1 text-sm text-zinc-500">{el.note}</p>}

                  <div className="mt-3 flex items-center gap-2">
                    <label className="text-xs text-zinc-500">Frekvence</label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={row.intervalDays}
                      disabled={!on}
                      onChange={(e) => setRow(el.id, { intervalDays: Number(e.target.value) || 1 })}
                      className="w-20 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 disabled:bg-zinc-100"
                    />
                    <span className="text-xs text-zinc-500">dní → {intervalLabel(row.intervalDays)}</span>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-5 flex items-center justify-between gap-4">
        <p className="text-sm text-zinc-500">
          Zařadí se <strong className="text-zinc-700">{enabledCount}</strong> z {elements.length} do
          kalendáře.
        </p>
        <div className="flex items-center gap-3">
          {isSubscribed && (
            <button
              type="button"
              onClick={cancel}
              className="text-sm text-red-600 transition hover:text-red-700"
            >
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

// Pojmenovaný wrapper kvůli čitelnosti (window.confirm).
function confirmWindow(msg: string): boolean {
  return typeof window === "undefined" ? true : window.confirm(msg);
}
