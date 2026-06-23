"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setTaskStatus } from "@/lib/actions/calendar";

export interface TodayTask {
  id: string;
  name: string;
  color: string;
  durationMin: number | null;
  note: string | null;
  status: string; // open | done | cancelled | postponed
}

const STATE: Record<string, { label: string; cls: string }> = {
  done: { label: "Splněno", cls: "text-green-600 line-through" },
  cancelled: { label: "Zrušeno", cls: "text-red-500 line-through" },
  postponed: { label: "Odloženo", cls: "text-amber-600 italic" },
};

export function TodayTasks({ tasks }: { tasks: TodayTask[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const set = (id: string, current: string, target: string) => {
    const next = current === target ? "open" : target; // klik na aktivní stav = zpět na open
    startTransition(async () => {
      await setTaskStatus(id, next);
      router.refresh();
    });
  };

  return (
    <div className={`space-y-2 ${pending ? "opacity-60" : ""}`}>
      {tasks.map((t) => {
        const st = STATE[t.status];
        return (
          <div key={t.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 p-3">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: t.color }} />
            <span className={st ? st.cls : "text-zinc-800"}>{t.name}</span>
            {t.durationMin ? <span className="text-xs text-zinc-400">{t.durationMin} min</span> : null}
            {t.note && <span className="truncate text-xs text-zinc-400">· {t.note}</span>}
            {st && <span className="text-xs font-medium text-zinc-400">— {st.label}</span>}

            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                onClick={() => set(t.id, t.status, "done")}
                title="Splněno"
                className={`rounded-md px-2 py-1 text-xs font-medium transition ${t.status === "done" ? "bg-green-600 text-white" : "border border-zinc-300 text-zinc-600 hover:bg-zinc-100"}`}
              >
                ✓
              </button>
              <button
                type="button"
                onClick={() => set(t.id, t.status, "postponed")}
                title="Odloženo"
                className={`rounded-md px-2 py-1 text-xs font-medium transition ${t.status === "postponed" ? "bg-amber-500 text-white" : "border border-zinc-300 text-zinc-600 hover:bg-zinc-100"}`}
              >
                ⏭
              </button>
              <button
                type="button"
                onClick={() => set(t.id, t.status, "cancelled")}
                title="Zrušeno"
                className={`rounded-md px-2 py-1 text-xs font-medium transition ${t.status === "cancelled" ? "bg-red-600 text-white" : "border border-zinc-300 text-zinc-600 hover:bg-zinc-100"}`}
              >
                ✕
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
