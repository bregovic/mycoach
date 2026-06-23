import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Trainer } from "@/components/trainer/trainer";
import { compileTraining } from "@/lib/trainer/compile";
import { getUserCues } from "@/lib/sounds-server";

export const metadata = { title: "Trénink" };

export default async function PresetTrainingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const training = await prisma.training.findFirst({
    where: { id, OR: [{ userId: session.user.id }, { isPublic: true }] },
    include: {
      blocks: {
        orderBy: { order: "asc" },
        include: { items: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!training) notFound();

  const segments = compileTraining({
    title: training.title,
    prepareSec: training.prepareSec,
    betweenBlocksSec: training.betweenBlocksSec,
    blocks: training.blocks.map((b) => ({
      title: b.title,
      category: b.category,
      rounds: b.rounds,
      prepareSec: b.prepareSec,
      restSec: b.restSec,
      restBetweenItems: b.restBetweenItems,
      restName: b.restName,
      restSpokenName: b.restSpokenName,
      restVoiceText: b.restVoiceText,
      restAudioKey: b.restAudioKey,
      items: b.items.map((it) => ({
        name: it.name,
        spokenName: it.spokenName,
        voiceText: it.voiceText,
        coop: it.coop,
        durationSec: it.durationSec,
        audioKey: it.audioKey,
      })),
    })),
  });

  const userName = session.user.name ?? session.user.email ?? "sportovče";
  // Cue: vlastní mají přednost; u cizího (veřejného) tréninku se chybějící typy
  // doplní cue autora – cue tedy „patří" k jeho veřejným tréninkům.
  const myCues = await getUserCues(session.user.id);
  const cues =
    training.userId === session.user.id
      ? myCues
      : { ...(await getUserCues(training.userId)), ...myCues };

  return (
    <Trainer
      userName={userName}
      preset={{ title: training.title, sportSlug: training.sportSlug, segments }}
      cues={cues}
    />
  );
}
