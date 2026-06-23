"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hhmmToMin, minToHHMM } from "@/lib/clubs";

async function requireUser(): Promise<{ id: string; email: string }> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new Error("Neautorizováno.");
  return { id, email: (session.user.email ?? "").toLowerCase() };
}

const str = (v: unknown, max: number): string => String(v ?? "").trim().slice(0, max);
const HEX = /^#/;

function revalidate(clubId?: string) {
  revalidatePath("/oddily");
  if (clubId) revalidatePath(`/oddily/${clubId}`);
}

function slugify(input: string): string {
  return (
    input
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "oddil"
  );
}
async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let i = 1;
  while (await prisma.club.findUnique({ where: { slug }, select: { id: true } })) {
    i += 1;
    slug = `${base}-${i}`;
  }
  return slug;
}

/** Role uživatele v oddílu: 'owner' | 'trainer' | 'member' | null. */
async function clubRole(clubId: string, userId: string): Promise<string | null> {
  const club = await prisma.club.findUnique({ where: { id: clubId }, select: { ownerId: true } });
  if (!club) return null;
  if (club.ownerId === userId) return "owner";
  const m = await prisma.clubMember.findUnique({
    where: { clubId_userId: { clubId, userId } },
    select: { role: true },
  });
  return m?.role ?? null;
}

async function requireOwner(clubId: string, userId: string): Promise<void> {
  if ((await clubRole(clubId, userId)) !== "owner") throw new Error("Jen správce oddílu.");
}
async function requireTrainer(clubId: string, userId: string): Promise<void> {
  const r = await clubRole(clubId, userId);
  if (r !== "owner" && r !== "trainer") throw new Error("Jen trenér/správce.");
}

// --- Oddíl -----------------------------------------------------------------

export async function createClub(): Promise<void> {
  const { id: userId } = await requireUser();
  const slug = await uniqueSlug(`oddil-${Date.now().toString(36)}`);
  const club = await prisma.club.create({
    data: {
      ownerId: userId,
      name: "Nový oddíl",
      slug,
      sportSlug: "box",
      members: { create: { userId, role: "owner" } },
    },
    select: { id: true },
  });
  redirect(`/oddily/${club.id}`);
}

export async function updateClubMeta(input: {
  id: string;
  name: string;
  address?: string;
  sportSlug?: string;
  isPublic?: boolean;
}): Promise<void> {
  const { id: userId } = await requireUser();
  await requireOwner(input.id, userId);
  await prisma.club.update({
    where: { id: input.id },
    data: {
      name: str(input.name, 60) || "Oddíl",
      address: str(input.address, 200) || null,
      sportSlug: str(input.sportSlug, 40) || null,
      isPublic: Boolean(input.isPublic),
    },
  });
  revalidate(input.id);
}

export async function updateClubLogo(id: string, dataUrl: string | null): Promise<void> {
  const { id: userId } = await requireUser();
  await requireOwner(id, userId);
  const value =
    typeof dataUrl === "string" &&
    dataUrl.length <= 400_000 &&
    /^data:image\/(jpeg|png|webp);base64,/.test(dataUrl)
      ? dataUrl
      : null;
  await prisma.club.update({ where: { id }, data: { logoUrl: value } });
  revalidate(id);
}

export async function deleteClub(id: string): Promise<void> {
  const { id: userId } = await requireUser();
  await requireOwner(id, userId);
  await prisma.club.delete({ where: { id } });
  redirect("/oddily");
}

// --- Rozvrh ----------------------------------------------------------------

export async function addScheduleRule(input: {
  clubId: string;
  weekdays: number[];
  start: string;
  end: string;
}): Promise<void> {
  const { id: userId } = await requireUser();
  await requireOwner(input.clubId, userId);
  const weekdays = [...new Set(input.weekdays)].filter((d) => d >= 0 && d <= 6).sort();
  const startMin = hhmmToMin(input.start);
  const endMin = hhmmToMin(input.end);
  if (weekdays.length === 0 || startMin == null || endMin == null || endMin <= startMin) return;
  await prisma.clubScheduleRule.create({ data: { clubId: input.clubId, weekdays, startMin, endMin } });
  revalidate(input.clubId);
}

export async function deleteScheduleRule(id: string): Promise<void> {
  const { id: userId } = await requireUser();
  const rule = await prisma.clubScheduleRule.findUnique({ where: { id }, select: { clubId: true } });
  if (!rule) return;
  await requireOwner(rule.clubId, userId);
  // budoucí nepotvrzené termíny z rozvrhu zruš; minulé/potvrzené ponech
  await prisma.clubScheduleRule.delete({ where: { id } });
  revalidate(rule.clubId);
}

// --- Pozvánky a členství ---------------------------------------------------

export async function inviteMember(clubId: string, email: string, role: string): Promise<void> {
  const { id: userId } = await requireUser();
  await requireOwner(clubId, userId);
  const e = str(email, 120).toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return;
  const r = role === "trainer" ? "trainer" : "member";

  // už je členem? případně rovnou povýším roli
  const existingUser = await prisma.user.findUnique({ where: { email: e }, select: { id: true } });
  if (existingUser) {
    const m = await prisma.clubMember.findUnique({
      where: { clubId_userId: { clubId, userId: existingUser.id } },
      select: { id: true },
    });
    if (m) {
      if (existingUser.id !== userId) await prisma.clubMember.update({ where: { id: m.id }, data: { role: r } });
      revalidate(clubId);
      return;
    }
  }
  await prisma.clubInvite.upsert({
    where: { clubId_email: { clubId, email: e } },
    create: { clubId, email: e, role: r, invitedById: userId, status: "pending" },
    update: { status: "pending", role: r },
  });
  revalidate(clubId);
}

export async function cancelInvite(inviteId: string): Promise<void> {
  const { id: userId } = await requireUser();
  const inv = await prisma.clubInvite.findUnique({ where: { id: inviteId }, select: { clubId: true } });
  if (!inv) return;
  await requireOwner(inv.clubId, userId);
  await prisma.clubInvite.delete({ where: { id: inviteId } });
  revalidate(inv.clubId);
}

export async function acceptInvite(inviteId: string): Promise<void> {
  const { id: userId, email } = await requireUser();
  const inv = await prisma.clubInvite.findUnique({ where: { id: inviteId } });
  if (!inv || inv.email.toLowerCase() !== email || inv.status !== "pending") return;
  const role = inv.role === "trainer" ? "trainer" : "member";
  await prisma.clubMember.upsert({
    where: { clubId_userId: { clubId: inv.clubId, userId } },
    create: { clubId: inv.clubId, userId, role },
    update: { role },
  });
  await prisma.clubInvite.update({ where: { id: inviteId }, data: { status: "accepted" } });
  revalidate(inv.clubId);
}

export async function declineInvite(inviteId: string): Promise<void> {
  const { email } = await requireUser();
  const inv = await prisma.clubInvite.findUnique({ where: { id: inviteId } });
  if (!inv || inv.email.toLowerCase() !== email) return;
  await prisma.clubInvite.update({ where: { id: inviteId }, data: { status: "declined" } });
  revalidate(inv.clubId);
}

export async function joinClub(clubId: string): Promise<void> {
  const { id: userId } = await requireUser();
  const club = await prisma.club.findUnique({ where: { id: clubId }, select: { isPublic: true } });
  if (!club?.isPublic) return; // jen veřejné lze připojit přímo
  await prisma.clubMember.upsert({
    where: { clubId_userId: { clubId, userId } },
    create: { clubId, userId, role: "member" },
    update: {},
  });
  revalidate(clubId);
}

export async function leaveClub(clubId: string): Promise<void> {
  const { id: userId } = await requireUser();
  const club = await prisma.club.findUnique({ where: { id: clubId }, select: { ownerId: true } });
  if (!club || club.ownerId === userId) return; // správce nemůže odejít
  await prisma.clubMember.deleteMany({ where: { clubId, userId } });
  revalidate(clubId);
}

export async function setMemberRole(clubId: string, userId: string, role: string): Promise<void> {
  const { id: me } = await requireUser();
  await requireOwner(clubId, me);
  const club = await prisma.club.findUnique({ where: { id: clubId }, select: { ownerId: true } });
  if (!club || club.ownerId === userId) return; // role správce se nemění
  const r = role === "trainer" ? "trainer" : "member";
  await prisma.clubMember.updateMany({ where: { clubId, userId }, data: { role: r } });
  revalidate(clubId);
}

export async function removeMember(clubId: string, userId: string): Promise<void> {
  const { id: me } = await requireUser();
  await requireOwner(clubId, me);
  const club = await prisma.club.findUnique({ where: { id: clubId }, select: { ownerId: true } });
  if (!club || club.ownerId === userId) return;
  await prisma.clubMember.deleteMany({ where: { clubId, userId } });
  revalidate(clubId);
}

// --- Termíny (sessions) ----------------------------------------------------

async function sessionClub(sessionId: string): Promise<string | null> {
  const s = await prisma.clubSession.findUnique({ where: { id: sessionId }, select: { clubId: true } });
  return s?.clubId ?? null;
}

/**
 * Nastaví můj stav na termínu: "going" (přijdu) nebo "excused" (omluveno).
 * Kliknutí na již aktivní stav ho zruší (žádná odpověď). Jen člen oddílu.
 */
export async function setAttendance(sessionId: string, status: string): Promise<void> {
  const { id: userId } = await requireUser();
  const value = status === "excused" ? "excused" : "going";
  const clubId = await sessionClub(sessionId);
  if (!clubId) return;
  if ((await clubRole(clubId, userId)) == null) return; // musí být člen
  const existing = await prisma.sessionAttendance.findUnique({
    where: { sessionId_userId: { sessionId, userId } },
    select: { id: true, status: true },
  });
  let nowGoing = false;
  if (existing && existing.status === value) {
    await prisma.sessionAttendance.delete({ where: { id: existing.id } });
  } else if (existing) {
    await prisma.sessionAttendance.update({ where: { id: existing.id }, data: { status: value } });
    nowGoing = value === "going";
  } else {
    await prisma.sessionAttendance.create({ data: { sessionId, userId, status: value } });
    nowGoing = value === "going";
  }
  await syncClubTask(userId, sessionId, nowGoing);
  revalidate(clubId);
  revalidatePath("/kalendar");
}

const CLUB_COLOR = "#6366f1";

/** Synchronizuje kalendářní úkol s přihlášením na termín („Přijdu"). */
async function syncClubTask(userId: string, sessionId: string, going: boolean): Promise<void> {
  if (!going) {
    await prisma.scheduledTask.deleteMany({ where: { userId, clubSessionId: sessionId } });
    return;
  }
  const s = await prisma.clubSession.findUnique({
    where: { id: sessionId },
    select: { clubId: true, date: true, startMin: true, endMin: true, club: { select: { name: true } } },
  });
  if (!s) return;
  const slug = `club:${s.clubId}`;
  let act = await prisma.activity.findFirst({ where: { userId, sportSlug: slug }, select: { id: true } });
  if (!act) {
    act = await prisma.activity.create({
      data: { userId, name: s.club.name.slice(0, 60) || "Oddíl", color: CLUB_COLOR, sportSlug: slug },
      select: { id: true },
    });
  }
  await prisma.scheduledTask.upsert({
    where: { userId_clubSessionId: { userId, clubSessionId: sessionId } },
    create: {
      userId,
      activityId: act.id,
      clubSessionId: sessionId,
      date: s.date,
      title: s.club.name,
      durationMin: Math.max(0, s.endMin - s.startMin),
      note: `Oddíl · ${minToHHMM(s.startMin)}–${minToHHMM(s.endMin)}`,
    },
    update: { date: s.date, activityId: act.id },
  });
}

export async function confirmSession(sessionId: string, confirmed: boolean): Promise<void> {
  const { id: userId } = await requireUser();
  const clubId = await sessionClub(sessionId);
  if (!clubId) return;
  await requireTrainer(clubId, userId);
  await prisma.clubSession.update({ where: { id: sessionId }, data: { trainerConfirmed: confirmed } });
  revalidate(clubId);
}

export async function cancelSession(sessionId: string, canceled: boolean): Promise<void> {
  const { id: userId } = await requireUser();
  const clubId = await sessionClub(sessionId);
  if (!clubId) return;
  await requireTrainer(clubId, userId);
  await prisma.clubSession.update({ where: { id: sessionId }, data: { canceled } });
  revalidate(clubId);
}

export async function assignTraining(sessionId: string, trainingId: string | null): Promise<void> {
  const { id: userId } = await requireUser();
  const clubId = await sessionClub(sessionId);
  if (!clubId) return;
  await requireTrainer(clubId, userId);
  let valid: string | null = null;
  if (trainingId) {
    const t = await prisma.training.findFirst({
      where: { id: trainingId, OR: [{ userId }, { isPublic: true }] },
      select: { id: true },
    });
    valid = t?.id ?? null;
  }
  await prisma.clubSession.update({ where: { id: sessionId }, data: { trainingId: valid } });
  revalidate(clubId);
}
