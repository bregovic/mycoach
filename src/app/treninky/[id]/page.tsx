import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";
import {
  TrainingEditor,
  type TrainingDTO,
  type SportDTO,
  type ExerciseDTO,
} from "@/components/trainings/training-editor";

export const metadata = { title: "Úprava tréninku" };

export default async function TrainingEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const [training, sports, exercises] = await Promise.all([
    prisma.training.findFirst({
      where: { id, userId: session.user.id },
      include: {
        blocks: {
          orderBy: { order: "asc" },
          include: { items: { orderBy: { order: "asc" } } },
        },
      },
    }),
    prisma.sport.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true, icon: true } }),
    prisma.exercise.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        spokenName: true,
        category: true,
        coop: true,
        defaultSec: true,
        sport: { select: { slug: true } },
      },
    }),
  ]);
  if (!training) notFound();

  const dto: TrainingDTO = {
    id: training.id,
    number: training.number,
    title: training.title,
    description: training.description,
    sportSlug: training.sportSlug,
    difficulty: training.difficulty,
    imageUrl: training.imageUrl,
    targetMin: training.targetMin,
    isPublic: training.isPublic,
    prepareSec: training.prepareSec,
    blocks: training.blocks.map((b) => ({
      id: b.id,
      title: b.title,
      category: b.category,
      rounds: b.rounds,
      restSec: b.restSec,
      items: b.items.map((it) => ({
        id: it.id,
        name: it.name,
        spokenName: it.spokenName,
        voiceText: it.voiceText,
        coop: it.coop,
        durationSec: it.durationSec,
        exerciseId: it.exerciseId,
      })),
    })),
  };

  const sportsDto: SportDTO[] = sports.map((s) => ({ slug: s.slug, name: s.name, icon: s.icon }));
  const exercisesDto: ExerciseDTO[] = exercises.map((e) => ({
    id: e.id,
    name: e.name,
    spokenName: e.spokenName,
    category: e.category,
    coop: e.coop,
    defaultSec: e.defaultSec,
    sportSlug: e.sport.slug,
  }));

  return (
    <main className="min-h-dvh bg-gradient-to-b from-zinc-50 to-zinc-100/40">
      <AppHeader back={{ href: "/treninky", label: "Úprava tréninku" }} />

      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <TrainingEditor training={dto} sports={sportsDto} exercises={exercisesDto} />
      </section>
    </main>
  );
}
