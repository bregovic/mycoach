import { notFound, redirect } from "next/navigation";
import { Teko, Barlow } from "next/font/google";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Trainer } from "@/components/trainer/trainer";
import { compileTraining } from "@/lib/trainer/compile";
import { getUserCues } from "@/lib/sounds-server";

const teko = Teko({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  variable: "--font-teko",
});
const barlow = Barlow({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700"],
  variable: "--font-barlow",
});

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
    blocks: training.blocks.map((b) => ({
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
        audioKey: it.audioKey,
      })),
    })),
  });

  const userName = session.user.name ?? session.user.email ?? "sportovče";
  const cues = await getUserCues(session.user.id);

  return (
    <div className={`${teko.variable} ${barlow.variable}`}>
      <Trainer
        userName={userName}
        preset={{ title: training.title, sportSlug: training.sportSlug, segments }}
        cues={cues}
      />
    </div>
  );
}
