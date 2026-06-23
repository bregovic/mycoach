import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";
import { ensureClubSessions } from "@/lib/club-sessions";
import { dateKey, keyToDate } from "@/lib/calendar";
import { sessionStatus } from "@/lib/clubs";
import { ClubView, type ClubDTO } from "@/components/clubs/club-view";

export const metadata = { title: "Oddíl" };

export default async function ClubDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const { id } = await params;
  const club = await prisma.club.findUnique({
    where: { id },
    include: {
      rules: { orderBy: { startMin: "asc" } },
      members: {
        include: { user: { select: { name: true, email: true } } },
        orderBy: { joinedAt: "asc" },
      },
      invites: { where: { status: "pending" } },
    },
  });
  if (!club) notFound();

  const myMembership = club.members.find((m) => m.userId === userId);
  const myRole = club.ownerId === userId ? "owner" : (myMembership?.role ?? null);
  const isMember = myRole != null;
  if (!isMember && !club.isPublic) redirect("/oddily");

  // Termíny na ~4 týdny dopředu
  const todayKey = dateKey(new Date());
  const end = keyToDate(todayKey);
  end.setUTCDate(end.getUTCDate() + 28);
  const endKey = dateKey(end);
  if (isMember || club.isPublic) await ensureClubSessions(club.id, todayKey, endKey);

  const sessions = await prisma.clubSession.findMany({
    where: { clubId: club.id, date: { gte: keyToDate(todayKey), lte: keyToDate(endKey) } },
    orderBy: [{ date: "asc" }, { startMin: "asc" }],
    include: {
      training: { select: { title: true } },
      attendances: { select: { userId: true, status: true, user: { select: { name: true, email: true, image: true } } } },
    },
  });

  const canTrainer = myRole === "owner" || myRole === "trainer";
  const trainings = canTrainer
    ? await prisma.training.findMany({
        where: { OR: [{ userId }, { isPublic: true }] },
        orderBy: { updatedAt: "desc" },
        take: 50,
        select: { id: true, title: true },
      })
    : [];

  const dto: ClubDTO = {
    id: club.id,
    name: club.name,
    logoUrl: club.logoUrl,
    address: club.address,
    sportSlug: club.sportSlug,
    isPublic: club.isPublic,
    myRole,
    rules: club.rules.map((r) => ({ id: r.id, weekdays: r.weekdays, startMin: r.startMin, endMin: r.endMin })),
    members: club.members.map((m) => ({
      userId: m.userId,
      name: m.user.name ?? m.user.email ?? "?",
      role: m.userId === club.ownerId ? "owner" : m.role,
    })),
    invites: club.invites.map((i) => ({ id: i.id, email: i.email, role: i.role })),
    sessions: sessions.map((s) => {
      const going = s.attendances.filter((a) => a.status === "going");
      const excused = s.attendances.filter((a) => a.status === "excused");
      const mine = s.attendances.find((a) => a.userId === userId);
      const nameOf = (a: (typeof s.attendances)[number]) => a.user.name ?? a.user.email ?? "?";
      return {
        id: s.id,
        dateKey: s.date.toISOString().slice(0, 10),
        startMin: s.startMin,
        endMin: s.endMin,
        status: sessionStatus(s, going.length),
        goingCount: going.length,
        myStatus: mine?.status ?? null,
        trainingId: s.trainingId,
        trainingTitle: s.training?.title ?? null,
        attendees: [
          ...going.map((a) => ({ name: nameOf(a), image: a.user.image, status: "going" as const })),
          ...excused.map((a) => ({ name: nameOf(a), image: a.user.image, status: "excused" as const })),
        ],
      };
    }),
    trainings,
  };

  return (
    <main className="min-h-dvh bg-gradient-to-b from-zinc-50 to-zinc-100/40">
      <AppHeader back={{ href: "/oddily", label: "Oddíl" }} />
      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <ClubView club={dto} />
      </section>
    </main>
  );
}
