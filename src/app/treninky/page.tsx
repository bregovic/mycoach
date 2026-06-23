import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";
import { createTraining } from "@/lib/actions/trainings";
import { compileTraining } from "@/lib/trainer/compile";
import { workoutTotals, formatTime } from "@/lib/trainer/generate";

export const metadata = { title: "Moje tréninky" };

export default async function TrainingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const trainings = await prisma.training.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      blocks: {
        orderBy: { order: "asc" },
        include: { items: { orderBy: { order: "asc" } } },
      },
    },
  });

  const rows = trainings.map((t) => {
    const segments = compileTraining({
      title: t.title,
      prepareSec: t.prepareSec,
      blocks: t.blocks.map((b) => ({
        title: b.title,
        category: b.category,
        rounds: b.rounds,
        restSec: b.restSec,
        items: b.items.map((it) => ({
          name: it.name,
          spokenName: it.spokenName,
          voiceText: it.voiceText,
          coop: it.coop,
          durationSec: it.durationSec,
        })),
      })),
    });
    const totals = workoutTotals(segments);
    return {
      id: t.id,
      title: t.title,
      sportSlug: t.sportSlug,
      blocks: t.blocks.length,
      rounds: totals.rounds,
      totalSec: totals.totalSec,
    };
  });

  return (
    <main className="min-h-dvh bg-gradient-to-b from-zinc-50 to-zinc-100/40">
      <AppHeader back={{ href: "/dashboard", label: "Moje tréninky" }} />

      <section className="mx-auto max-w-3xl px-6 py-12">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Moje tréninky</h1>
          <form action={createTraining}>
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              + Nový trénink
            </button>
          </form>
        </div>

        {rows.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
            <p className="text-zinc-500">Zatím nemáš žádný vlastní trénink.</p>
            <p className="mt-1 text-sm text-zinc-400">
              Vytvoř si trénink, poskládej bloky a cviky a spusť ho s hlasovým vedením.
            </p>
          </div>
        ) : (
          <ul className="mt-8 space-y-3">
            {rows.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300 hover:shadow-sm"
              >
                <Link href={`/treninky/${r.id}`} className="min-w-0 flex-1">
                  <h2 className="truncate text-lg font-medium text-zinc-900">{r.title}</h2>
                  <p className="mt-0.5 text-sm text-zinc-500">
                    {r.sportSlug ? `${r.sportSlug} · ` : ""}
                    {r.blocks} {pluralBlok(r.blocks)} · {r.rounds} kol · {formatTime(r.totalSec)}
                  </p>
                </Link>
                {r.rounds > 0 && (
                  <Link
                    href={`/trening/${r.id}`}
                    className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
                  >
                    Spustit →
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function pluralBlok(n: number): string {
  if (n === 1) return "blok";
  if (n >= 2 && n <= 4) return "bloky";
  return "bloků";
}
