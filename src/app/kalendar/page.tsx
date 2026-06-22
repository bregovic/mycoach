import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Brand } from "@/components/brand";
import {
  CalendarView,
  type ActivityDTO,
  type ScheduleDTO,
  type TaskDTO,
} from "@/components/calendar/calendar-view";
import {
  dateKey,
  keyToDate,
  monthMatrix,
  monthParam,
  parseMonthParam,
  shiftMonth,
} from "@/lib/calendar";
import { ensureScheduleTasks } from "@/lib/calendar-tasks";

export const metadata = { title: "Kalendář" };

const monthFmt = new Intl.DateTimeFormat("cs-CZ", { month: "long", year: "numeric" });

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const { year, month0 } = parseMonthParam((await searchParams).month);
  const weeks = monthMatrix(year, month0);
  const rangeStartKey = weeks[0][0];
  const rangeEndKey = weeks[5][6];

  // Dogeneruj úkoly z opakovaných rozvrhů pro viditelný rozsah.
  await ensureScheduleTasks(userId, rangeStartKey, rangeEndKey);

  const [activities, schedules, rawTasks] = await Promise.all([
    prisma.activity.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, color: true },
    }),
    prisma.activitySchedule.findMany({
      where: { userId, active: true },
      orderBy: { createdAt: "asc" },
      select: { id: true, activityId: true, weekdays: true },
    }),
    prisma.scheduledTask.findMany({
      where: { userId, date: { gte: keyToDate(rangeStartKey), lte: keyToDate(rangeEndKey) } },
      select: { id: true, activityId: true, date: true, note: true, durationMin: true, done: true },
    }),
  ]);

  const tasks: TaskDTO[] = rawTasks.map((t) => ({
    id: t.id,
    activityId: t.activityId,
    dateKey: t.date.toISOString().slice(0, 10),
    note: t.note,
    durationMin: t.durationMin,
    done: t.done,
  }));

  const prev = shiftMonth(year, month0, -1);
  const next = shiftMonth(year, month0, 1);
  const label = monthFmt.format(new Date(Date.UTC(year, month0, 1)));
  const todayKey = dateKey(new Date());

  return (
    <main className="min-h-dvh bg-zinc-50">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white/80 px-6 py-4 backdrop-blur">
        <Link href="/dashboard">
          <Brand />
        </Link>
        <Link href="/profil" className="text-sm text-zinc-500 transition hover:text-zinc-900">
          ← Profil
        </Link>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-12">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold capitalize tracking-tight text-zinc-900">{label}</h1>
          <div className="flex items-center gap-1">
            <Link
              href={`/kalendar?month=${monthParam(prev.year, prev.month0)}`}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-300 text-zinc-600 transition hover:bg-zinc-100"
              aria-label="Předchozí měsíc"
            >
              ‹
            </Link>
            <Link
              href="/kalendar"
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 transition hover:bg-zinc-100"
            >
              Dnes
            </Link>
            <Link
              href={`/kalendar?month=${monthParam(next.year, next.month0)}`}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-300 text-zinc-600 transition hover:bg-zinc-100"
              aria-label="Další měsíc"
            >
              ›
            </Link>
          </div>
        </div>

        <div className="mt-8 space-y-0">
          <CalendarView
            weeks={weeks}
            year={year}
            month0={month0}
            todayKey={todayKey}
            activities={activities as ActivityDTO[]}
            tasks={tasks}
            schedules={schedules as ScheduleDTO[]}
          />
        </div>
      </section>
    </main>
  );
}
