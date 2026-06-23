import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";
import { createTraining, addTrainingToCalendar } from "@/lib/actions/trainings";
import { compileTraining } from "@/lib/trainer/compile";
import { workoutTotals, formatTime } from "@/lib/trainer/generate";
import { difficultyLabel } from "@/lib/training-meta";

export const metadata = { title: "Moje tréninky" };

type Blockish = {
  title: string;
  category: string | null;
  rounds: number;
  restSec: number;
  items: { name: string; spokenName: string | null; voiceText: string | null; coop: string | null; durationSec: number }[];
};

function totalsOf(prepareSec: number, blocks: Blockish[]) {
  return workoutTotals(compileTraining({ title: "", prepareSec, blocks }));
}

export default async function TrainingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;
  const q = ((await searchParams).q ?? "").trim();

  const include = {
    blocks: { orderBy: { order: "asc" as const }, include: { items: { orderBy: { order: "asc" as const } } } },
  };

  const [mine, sports, publicRaw] = await Promise.all([
    prisma.training.findMany({ where: { userId }, orderBy: { updatedAt: "desc" }, include }),
    prisma.sport.findMany({ select: { slug: true, name: true } }),
    prisma.training.findMany({
      where: {
        isPublic: true,
        userId: { not: userId },
        ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] } : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: 30,
      include: { ...include, user: { select: { name: true } } },
    }),
  ]);

  const sportName = new Map(sports.map((s) => [s.slug, s.name]));
  const row = (t: (typeof mine)[number]) => {
    const tot = totalsOf(t.prepareSec, t.blocks);
    return {
      id: t.id,
      number: t.number,
      title: t.title,
      sport: t.sportSlug ? (sportName.get(t.sportSlug) ?? t.sportSlug) : null,
      difficulty: difficultyLabel(t.difficulty),
      imageUrl: t.imageUrl,
      isPublic: t.isPublic,
      blocks: t.blocks.length,
      rounds: tot.rounds,
      totalSec: tot.totalSec,
    };
  };
  const mineRows = mine.map(row);
  const publicRows = publicRaw.map((t) => ({ ...row(t), author: t.user.name }));

  return (
    <main className="min-h-dvh bg-gradient-to-b from-zinc-50 to-zinc-100/40">
      <AppHeader back={{ href: "/dashboard", label: "Tréninky" }} />

      <section className="mx-auto max-w-3xl px-6 py-12">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Moje tréninky</h1>
          <form action={createTraining}>
            <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800">
              + Nový trénink
            </button>
          </form>
        </div>

        {mineRows.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
            <p className="text-zinc-500">Zatím nemáš žádný vlastní trénink.</p>
            <p className="mt-1 text-sm text-zinc-400">Vytvoř si trénink, poskládej bloky a cviky a spusť ho s hlasovým vedením.</p>
          </div>
        ) : (
          <ul className="mt-8 space-y-3">
            {mineRows.map((r) => (
              <li key={r.id} className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 hover:shadow-sm">
                <Thumb url={r.imageUrl} />
                <Link href={`/treninky/${r.id}`} className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">#{r.number}</span>
                    <h2 className="truncate text-lg font-medium text-zinc-900">{r.title}</h2>
                    {r.isPublic && <span className="rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-green-700">Veřejný</span>}
                  </div>
                  <p className="mt-0.5 text-sm text-zinc-500">{meta(r)}</p>
                </Link>
                {r.rounds > 0 && (
                  <Link href={`/trening/${r.id}`} className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800">
                    Spustit →
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Veřejné tréninky */}
        <div className="mt-14">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Veřejné tréninky</h2>
          <p className="mt-1 text-sm text-zinc-500">Tréninky ostatních — spusť je, nebo si je přidej do kalendáře.</p>

          <form className="mt-4 flex gap-2" action="/treninky">
            <input name="q" defaultValue={q} placeholder="Hledat veřejný trénink…" className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-500" />
            <button type="submit" className="shrink-0 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100">
              Hledat
            </button>
          </form>

          {publicRows.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-400">
              {q ? "Nic nenalezeno." : "Zatím tu nejsou žádné veřejné tréninky."}
            </p>
          ) : (
            <ul className="mt-5 space-y-3">
              {publicRows.map((r) => (
                <li key={r.id} className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 hover:shadow-sm">
                  <Thumb url={r.imageUrl} />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-medium text-zinc-900">{r.title}</h3>
                    <p className="mt-0.5 text-sm text-zinc-500">
                      {meta(r)}
                      {r.author ? ` · ${r.author}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <form action={addTrainingToCalendar.bind(null, r.id)}>
                      <button type="submit" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100">
                        + Kalendář
                      </button>
                    </form>
                    {r.rounds > 0 && (
                      <Link href={`/trening/${r.id}`} className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800">
                        Spustit →
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}

function Thumb({ url }: { url: string | null }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element -- data URL
    return <img src={url} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-zinc-200" />;
  }
  return <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-xl">🥊</span>;
}

function meta(r: { sport: string | null; difficulty: string | null; blocks: number; rounds: number; totalSec: number }): string {
  const parts = [
    r.sport,
    r.difficulty,
    `${r.blocks} ${pluralBlok(r.blocks)}`,
    `${r.rounds} kol`,
    formatTime(r.totalSec),
  ].filter(Boolean);
  return parts.join(" · ");
}

function pluralBlok(n: number): string {
  if (n === 1) return "blok";
  if (n >= 2 && n <= 4) return "bloky";
  return "bloků";
}
