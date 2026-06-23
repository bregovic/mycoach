import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";
import { ensureScheduleTasks } from "@/lib/calendar-tasks";
import { dateKey, keyToDate } from "@/lib/calendar";
import { minToHHMM } from "@/lib/clubs";
import { TodayTasks } from "@/components/dashboard/today-tasks";

export const metadata = { title: "Přehled" };

type Tile = { href: string; icon: string; title: string; desc: string; cta: string; accent?: boolean };

const TILES: Tile[] = [
  { href: "/trening", icon: "🥊", title: "Trénink", desc: "Hlasově řízený intervalový trénink", cta: "Spustit", accent: true },
  { href: "/kalendar", icon: "🗓️", title: "Kalendář", desc: "Plánuj tréninky a úkoly", cta: "Otevřít" },
  { href: "/treninky", icon: "🧱", title: "Moje tréninky", desc: "Skládej vlastní tréninky z bloků", cta: "Otevřít" },
  { href: "/balicky", icon: "📦", title: "Balíčky", desc: "Programy na míru → do kalendáře", cta: "Procházet" },
  { href: "/oddily", icon: "👥", title: "Oddíly", desc: "Skupiny, rozvrh a termíny tréninků", cta: "Otevřít" },
  { href: "/cviky", icon: "📚", title: "Katalog", desc: "Sdílený číselník cviků dle sportu", cta: "Otevřít" },
];

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const todayKey = dateKey(new Date());
  const today = keyToDate(todayKey);
  await ensureScheduleTasks(userId, todayKey, todayKey);

  const [tasks, clubSessions] = await Promise.all([
    prisma.scheduledTask.findMany({
      where: { userId, date: today, clubSessionId: null },
      include: { activity: { select: { name: true, color: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.clubSession.findMany({
      where: { date: today, attendances: { some: { userId, status: "going" } } },
      include: { club: { select: { id: true, name: true } }, training: { select: { id: true, title: true } } },
      orderBy: { startMin: "asc" },
    }),
  ]);

  const hasToday = tasks.length > 0 || clubSessions.length > 0;
  const dateLabel = new Intl.DateTimeFormat("cs-CZ", { weekday: "long", day: "numeric", month: "long" }).format(today);

  return (
    <main className="min-h-dvh bg-gradient-to-b from-zinc-50 to-zinc-100/40">
      <AppHeader />

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Dnes */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-zinc-900">Dnes</h2>
            <span className="text-sm capitalize text-zinc-400">{dateLabel}</span>
          </div>

          {!hasToday ? (
            <p className="mt-3 text-sm text-zinc-400">Na dnešek nemáš žádný úkol ani trénink.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {clubSessions.map((s) => (
                <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50/60 p-3">
                  <span className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">
                    {minToHHMM(s.startMin)}–{minToHHMM(s.endMin)}
                  </span>
                  <Link href={`/oddily/${s.club.id}`} className="font-medium text-zinc-900 hover:underline">
                    {s.club.name}
                  </Link>
                  {s.training && <span className="text-sm text-zinc-500">· 🥊 {s.training.title}</span>}
                  {s.training && (
                    <Link
                      href={`/trening/${s.training.id}`}
                      className="ml-auto rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-800"
                    >
                      Spustit →
                    </Link>
                  )}
                </div>
              ))}

              <TodayTasks
                tasks={tasks.map((t) => ({
                  id: t.id,
                  name: t.activity.name,
                  color: t.activity.color,
                  durationMin: t.durationMin,
                  note: t.note,
                  status: t.status,
                }))}
              />
            </div>
          )}
          <div className="mt-4 flex items-center gap-4">
            <Link href="/kalendar" className="text-sm font-medium text-zinc-500 transition hover:text-zinc-800">
              Celý kalendář →
            </Link>
            <Link href="/historie" className="text-sm font-medium text-zinc-500 transition hover:text-zinc-800">
              Historie →
            </Link>
          </div>
        </div>

        {/* Dlaždice */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TILES.map((t) =>
            t.accent ? (
              <Link key={t.href} href={t.href} className="group flex flex-col rounded-2xl bg-zinc-900 p-6 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <span className="text-2xl">{t.icon}</span>
                <h2 className="mt-3 text-lg font-medium">{t.title}</h2>
                <p className="mt-1 text-sm text-zinc-300">{t.desc}</p>
                <span className="mt-6 text-sm font-medium text-zinc-400 transition group-hover:text-white">{t.cta} →</span>
              </Link>
            ) : (
              <Link key={t.href} href={t.href} className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md">
                <span className="text-2xl">{t.icon}</span>
                <h2 className="mt-3 text-lg font-medium text-zinc-900">{t.title}</h2>
                <p className="mt-1 text-sm text-zinc-500">{t.desc}</p>
                <span className="mt-6 text-sm font-medium text-zinc-400 transition group-hover:text-zinc-700">{t.cta} →</span>
              </Link>
            ),
          )}
        </div>
      </section>
    </main>
  );
}
