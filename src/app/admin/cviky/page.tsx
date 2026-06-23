import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";
import {
  ExerciseAdmin,
  type AdminSport,
  type AdminExercise,
} from "@/components/admin/exercise-admin";

export const metadata = { title: "Administrace · Cviky" };

export default async function ExerciseAdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (me?.role !== "admin") redirect("/dashboard");

  const [sports, exercises] = await Promise.all([
    prisma.sport.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true, icon: true } }),
    prisma.exercise.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        category: true,
        coop: true,
        defaultSec: true,
        spokenName: true,
        voiceText: true,
        sport: { select: { slug: true } },
      },
    }),
  ]);

  const sportsDto: AdminSport[] = sports.map((s) => ({ slug: s.slug, name: s.name, icon: s.icon }));
  const exercisesDto: AdminExercise[] = exercises.map((e) => ({
    id: e.id,
    name: e.name,
    category: e.category,
    coop: e.coop,
    defaultSec: e.defaultSec,
    spokenName: e.spokenName,
    voiceText: e.voiceText,
    sportSlug: e.sport.slug,
  }));

  return (
    <main className="min-h-dvh bg-gradient-to-b from-zinc-50 to-zinc-100/40">
      <AppHeader back={{ href: "/dashboard", label: "Administrace" }} />

      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Číselník cviků</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Sdílený katalog cviků podle sportu — používá se v editoru tréninku.
        </p>
        <div className="mt-6">
          <ExerciseAdmin sports={sportsDto} exercises={exercisesDto} />
        </div>
      </section>
    </main>
  );
}
