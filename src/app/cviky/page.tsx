import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";
import {
  CatalogManager,
  type CatSport,
  type CatExercise,
  type CatPreset,
} from "@/components/catalog/catalog-manager";

export const metadata = { title: "Katalog cviků" };

export default async function CatalogPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  const isAdmin = me?.role === "admin";

  const [sports, exercises, presets] = await Promise.all([
    prisma.sport.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true, icon: true, imageUrl: true } }),
    prisma.exercise.findMany({
      where: { OR: [{ isPrivate: false }, { ownerId: userId }] },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        category: true,
        coop: true,
        defaultSec: true,
        spokenName: true,
        voiceText: true,
        isPrivate: true,
        ownerId: true,
        sport: { select: { slug: true } },
      },
    }),
    isAdmin
      ? prisma.elementPreset.findMany({ orderBy: { name: "asc" } })
      : Promise.resolve([]),
  ]);

  const sportsDto: CatSport[] = sports.map((s) => ({ slug: s.slug, name: s.name, icon: s.icon, imageUrl: s.imageUrl }));
  const exercisesDto: CatExercise[] = exercises.map((e) => ({
    id: e.id,
    name: e.name,
    category: e.category,
    coop: e.coop,
    defaultSec: e.defaultSec,
    spokenName: e.spokenName,
    voiceText: e.voiceText,
    isPrivate: e.isPrivate,
    sportSlug: e.sport.slug,
    mine: e.ownerId === userId,
  }));
  const presetsDto: CatPreset[] = presets.map((p) => ({
    id: p.id,
    name: p.name,
    note: p.note,
    color: p.color,
    defaultIntervalDays: p.defaultIntervalDays,
    category: p.category,
  }));

  return (
    <main className="min-h-dvh bg-gradient-to-b from-zinc-50 to-zinc-100/40">
      <AppHeader back={{ href: "/dashboard", label: "Katalog cviků" }} />
      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Katalog cviků</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Sdílený číselník podle sportu. Vidíš veřejné cviky i svoje. Úprava cizího cviku vytvoří
          tvou kopii.
        </p>
        <div className="mt-6">
          <CatalogManager sports={sportsDto} exercises={exercisesDto} presets={presetsDto} isAdmin={isAdmin} />
        </div>
      </section>
    </main>
  );
}
