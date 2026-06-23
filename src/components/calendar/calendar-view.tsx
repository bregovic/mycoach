"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PRESET_ACTIVITIES, WEEKDAYS, keyToDate } from "@/lib/calendar";
import {
  addManualTask,
  createActivity,
  createSchedule,
  deleteActivity,
  deleteSchedule,
  deleteTask,
  setTaskDone,
} from "@/lib/actions/calendar";

export type ActivityDTO = { id: string; name: string; color: string };
export type TaskDTO = {
  id: string;
  activityId: string;
  dateKey: string;
  note: string | null;
  durationMin: number | null;
  done: boolean;
};
export type ScheduleDTO = { id: string; activityId: string; weekdays: number[] };

type Props = {
  weeks: string[][];
  year: number;
  month0: number;
  todayKey: string;
  activities: ActivityDTO[];
  tasks: TaskDTO[];
  schedules: ScheduleDTO[];
};

const dayFmt = new Intl.DateTimeFormat("cs-CZ", { weekday: "long", day: "numeric", month: "long" });

export function CalendarView({ weeks, year, month0, todayKey, activities, tasks, schedules }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string | null>(null);

  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      await fn();
      router.refresh();
    });

  const actById = useMemo(() => new Map(activities.map((a) => [a.id, a])), [activities]);
  const tasksByDay = useMemo(() => {
    const m = new Map<string, TaskDTO[]>();
    for (const t of tasks) {
      const arr = m.get(t.dateKey);
      if (arr) arr.push(t);
      else m.set(t.dateKey, [t]);
    }
    return m;
  }, [tasks]);

  return (
    <div className={pending ? "opacity-70 transition-opacity" : "transition-opacity"}>
      <ActivitiesManager activities={activities} run={run} />
      <ScheduleManager activities={activities} schedules={schedules} actById={actById} run={run} />

      {/* Mřížka měsíce */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50 text-center text-xs font-medium text-zinc-500">
          {WEEKDAYS.map((w) => (
            <div key={w.value} className="py-2">{w.short}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {weeks.flat().map((key) => {
            const d = keyToDate(key);
            const inMonth = d.getUTCFullYear() === year && d.getUTCMonth() === month0;
            const isToday = key === todayKey;
            const dayTasks = tasksByDay.get(key) ?? [];
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(key)}
                className={[
                  "min-h-16 border-b border-r border-zinc-100 p-1 text-left align-top transition hover:bg-zinc-50 sm:min-h-24 sm:p-1.5",
                  inMonth ? "bg-white" : "bg-zinc-50/60 text-zinc-400",
                  selected === key ? "ring-2 ring-inset ring-zinc-900" : "",
                ].join(" ")}
              >
                <span
                  className={[
                    "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs",
                    isToday ? "bg-zinc-900 font-semibold text-white" : inMonth ? "text-zinc-700" : "text-zinc-400",
                  ].join(" ")}
                >
                  {d.getUTCDate()}
                </span>
                <div className="mt-1 space-y-0.5">
                  {dayTasks.slice(0, 3).map((t) => {
                    const a = actById.get(t.activityId);
                    return (
                      <div key={t.id} className="flex items-center gap-1 truncate text-[11px] leading-tight">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: a?.color ?? "#a1a1aa" }} />
                        <span className={t.done ? "truncate text-zinc-400 line-through" : "truncate text-zinc-700"}>
                          {a?.name ?? "?"}
                        </span>
                      </div>
                    );
                  })}
                  {dayTasks.length > 3 && (
                    <div className="text-[11px] text-zinc-400">+{dayTasks.length - 3} další</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <DayPanel
          dateKey={selected}
          tasks={tasksByDay.get(selected) ?? []}
          activities={activities}
          actById={actById}
          onClose={() => setSelected(null)}
          run={run}
        />
      )}
    </div>
  );
}

// --------------------------------------------------------------------------

function ActivitiesManager({
  activities,
  run,
}: {
  activities: ActivityDTO[];
  run: (fn: () => Promise<unknown>) => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3b82f6");

  const existing = new Set(activities.map((a) => a.name.toLowerCase()));
  const presets = PRESET_ACTIVITIES.filter((p) => !existing.has(p.name.toLowerCase()));

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <h2 className="text-base font-semibold text-zinc-900">Moje aktivity</h2>

      <div className="mt-3 flex flex-wrap gap-2">
        {activities.length === 0 && <p className="text-sm text-zinc-400">Zatím žádná aktivita.</p>}
        {activities.map((a) => (
          <span key={a.id} className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 py-1 pl-2.5 pr-1.5 text-sm">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: a.color }} />
            {a.name}
            <button
              type="button"
              onClick={() => run(() => deleteActivity(a.id))}
              className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              aria-label={`Smazat ${a.name}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {presets.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-zinc-400">Rychle přidat</p>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p.slug}
                type="button"
                onClick={() => run(() => createActivity({ name: p.name, color: p.color, sportSlug: p.slug }))}
                className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-zinc-300 px-2.5 py-1 text-sm text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50"
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex items-end gap-2">
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
          className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-zinc-300 bg-white p-0.5" aria-label="Barva" />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Vlastní aktivita…"
          maxLength={60}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
        />
        <button
          type="button"
          disabled={!name.trim()}
          onClick={() => {
            const n = name.trim();
            if (!n) return;
            run(() => createActivity({ name: n, color }));
            setName("");
          }}
          className="shrink-0 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
        >
          Přidat
        </button>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------

function ScheduleManager({
  activities,
  schedules,
  actById,
  run,
}: {
  activities: ActivityDTO[];
  schedules: ScheduleDTO[];
  actById: Map<string, ActivityDTO>;
  run: (fn: () => Promise<unknown>) => void;
}) {
  const [activityId, setActivityId] = useState("");
  const [days, setDays] = useState<Set<number>>(new Set());

  const toggleDay = (v: number) =>
    setDays((prev) => {
      const next = new Set(prev);
      next.has(v) ? next.delete(v) : next.add(v);
      return next;
    });

  const canCreate = activityId && days.size > 0;

  return (
    <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5">
      <h2 className="text-base font-semibold text-zinc-900">Opakovaný rozvrh</h2>

      <div className="mt-3 space-y-2">
        {schedules.length === 0 && <p className="text-sm text-zinc-400">Žádný opakovaný rozvrh.</p>}
        {schedules.map((s) => {
          const a = actById.get(s.activityId);
          const labels = WEEKDAYS.filter((w) => s.weekdays.includes(w.value)).map((w) => w.short);
          return (
            <div key={s.id} className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: a?.color ?? "#a1a1aa" }} />
                <span className="font-medium text-zinc-800">{a?.name ?? "?"}</span>
                <span className="text-zinc-500">{labels.join(", ")}</span>
              </span>
              <button
                type="button"
                onClick={() => run(() => deleteSchedule(s.id))}
                className="text-zinc-400 hover:text-red-600"
                aria-label="Smazat rozvrh"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      {activities.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-400">Nejdřív přidej aktivitu výše.</p>
      ) : (
        <div className="mt-4 space-y-3 border-t border-zinc-100 pt-4">
          <select
            value={activityId}
            onChange={(e) => setActivityId(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          >
            <option value="">Vyber aktivitu…</option>
            {activities.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAYS.map((w) => (
              <button
                key={w.value}
                type="button"
                onClick={() => toggleDay(w.value)}
                className={[
                  "h-9 w-10 rounded-lg border text-sm font-medium transition",
                  days.has(w.value)
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-300 text-zinc-600 hover:bg-zinc-50",
                ].join(" ")}
              >
                {w.short}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={!canCreate}
            onClick={() => {
              run(() => createSchedule({ activityId, weekdays: [...days] }));
              setActivityId("");
              setDays(new Set());
            }}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
          >
            Vytvořit rozvrh
          </button>
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------

function DayPanel({
  dateKey,
  tasks,
  activities,
  actById,
  onClose,
  run,
}: {
  dateKey: string;
  tasks: TaskDTO[];
  activities: ActivityDTO[];
  actById: Map<string, ActivityDTO>;
  onClose: () => void;
  run: (fn: () => Promise<unknown>) => void;
}) {
  const [activityId, setActivityId] = useState("");
  const [note, setNote] = useState("");
  const [duration, setDuration] = useState("");

  return (
    <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold capitalize text-zinc-900">{dayFmt.format(keyToDate(dateKey))}</h2>
        <button type="button" onClick={onClose} className="text-sm text-zinc-400 hover:text-zinc-700">Zavřít</button>
      </div>

      <div className="space-y-2">
        {tasks.length === 0 && <p className="text-sm text-zinc-400">Žádný úkol pro tento den.</p>}
        {tasks.map((t) => {
          const a = actById.get(t.activityId);
          return (
            <div key={t.id} className="flex items-start gap-3 rounded-lg border border-zinc-200 p-3">
              <input
                type="checkbox"
                checked={t.done}
                onChange={(e) => run(() => setTaskDone(t.id, e.target.checked))}
                className="mt-0.5 h-4 w-4 shrink-0 accent-zinc-900"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: a?.color ?? "#a1a1aa" }} />
                  <span className={t.done ? "font-medium text-zinc-400 line-through" : "font-medium text-zinc-800"}>
                    {a?.name ?? "?"}
                  </span>
                  {t.durationMin ? <span className="text-xs text-zinc-400">{t.durationMin} min</span> : null}
                </div>
                {t.note && <p className="mt-0.5 text-sm text-zinc-500">{t.note}</p>}
              </div>
              <button
                type="button"
                onClick={() => run(() => deleteTask(t.id))}
                className="shrink-0 text-zinc-400 hover:text-red-600"
                aria-label="Smazat úkol"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      {activities.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-400">Nejdřív přidej aktivitu.</p>
      ) : (
        <div className="mt-4 flex flex-col gap-2 border-t border-zinc-100 pt-4 sm:flex-row sm:items-end">
          <select
            value={activityId}
            onChange={(e) => setActivityId(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 sm:w-40"
          >
            <option value="">Aktivita…</option>
            {activities.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Poznámka (nepovinné)"
            maxLength={200}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          />
          <input
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            type="number"
            min={1}
            placeholder="min"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 sm:w-20"
          />
          <button
            type="button"
            disabled={!activityId}
            onClick={() => {
              const dur = duration ? Number(duration) : null;
              run(() => addManualTask({ activityId, dateKey, note, durationMin: dur }));
              setActivityId("");
              setNote("");
              setDuration("");
            }}
            className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
          >
            Přidat úkol
          </button>
        </div>
      )}
    </div>
  );
}
