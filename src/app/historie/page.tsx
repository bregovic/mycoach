import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";

export const metadata = { title: "Historie" };

const dateFmt = new Intl.DateTimeFormat("cs-CZ", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const logs = await prisma.workoutLog.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
    take: 200,
    select: { id: true, date: true, title: true, durationMin: true, note: true, data: true },
  });

  const total = logs.length;
  const totalMin = logs.reduce((s, l) => s + (l.durationMin ?? 0), 0);

  return (
    <main className="min-h-dvh bg-gradient-to-b from-zinc-50 to-zinc-100/40">
      <AppHeader back={{ href: "/dashboard", label: "Historie" }} />

      <section className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Historie</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Co máš za sebou — odcvičené tréninky a splněné úkoly.
        </p>

        {total > 0 && (
          <div className="mt-4 flex gap-4 text-sm text-zinc-500">
            <span>
              Záznamů <strong className="text-zinc-800">{total}</strong>
            </span>
            {totalMin > 0 && (
              <span>
                Celkem <strong className="text-zinc-800">{Math.round(totalMin / 60)} h {totalMin % 60} min</strong>
              </span>
            )}
          </div>
        )}

        {total === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
            <p className="text-zinc-500">Zatím prázdno.</p>
            <p className="mt-1 text-sm text-zinc-400">
              Dokonči trénink v přehrávači nebo označ úkol jako splněný — objeví se tady.
            </p>
          </div>
        ) : (
          <ul className="mt-6 space-y-2">
            {logs.map((l) => {
              const isTrainer = (l.data as { source?: string } | null)?.source === "trainer";
              return (
                <li key={l.id} className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-lg">
                    {isTrainer ? "🥊" : "✓"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-medium text-zinc-900">{l.title ?? "Trénink"}</h2>
                    <p className="mt-0.5 text-sm capitalize text-zinc-500">{dateFmt.format(l.date)}</p>
                    {l.note && <p className="truncate text-xs text-zinc-400">{l.note}</p>}
                  </div>
                  {l.durationMin ? (
                    <span className="shrink-0 text-sm font-medium text-zinc-600">{l.durationMin} min</span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
