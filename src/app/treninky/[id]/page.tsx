import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";
import { TrainingEditor, type TrainingDTO } from "@/components/trainings/training-editor";

export const metadata = { title: "Úprava tréninku" };

export default async function TrainingEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const training = await prisma.training.findFirst({
    where: { id, userId: session.user.id },
    include: {
      blocks: {
        orderBy: { order: "asc" },
        include: { items: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!training) notFound();

  const dto: TrainingDTO = {
    id: training.id,
    title: training.title,
    description: training.description,
    sportSlug: training.sportSlug,
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
      })),
    })),
  };

  return (
    <main className="min-h-dvh bg-gradient-to-b from-zinc-50 to-zinc-100/40">
      <AppHeader back={{ href: "/treninky", label: "Úprava tréninku" }} />

      <section className="mx-auto max-w-3xl px-6 py-10">
        <TrainingEditor training={dto} />
      </section>
    </main>
  );
}
