"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { dateKey, keyToDate } from "@/lib/calendar";
import { ensureScheduleTasks } from "@/lib/calendar-tasks";
import { CATEGORY_LABELS } from "@/lib/packages";

async function requireUserId(): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new Error("Neautorizováno.");
  return id;
}

const HEX = /^#[0-9a-fA-F]{6}$/;
const clampInterval = (v: unknown): number => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(365, Math.max(1, n)) : 28;
};
const color = (c: unknown): string => (typeof c === "string" && HEX.test(c) ? c : "#18181b");

export interface ElementSelection {
  elementId: string;
  name: string;
  color: string;
  enabled: boolean;
  intervalDays: number;
}

/** Smaže existující odběr balíčku i jím vygenerované aktivity (vč. úkolů). */
async function teardownSubscription(userId: string, packageId: string): Promise<void> {
  const existing = await prisma.subscription.findUnique({
    where: { userId_packageId: { userId, packageId } },
    include: { elements: { select: { activityId: true } } },
  });
  if (!existing) return;
  const activityIds = existing.elements
    .map((e) => e.activityId)
    .filter((x): x is string => Boolean(x));
  if (activityIds.length) {
    // Cascade smaže i intervalové rozvrhy a naplánované úkoly. Reálná historie
    // v WorkoutLog zůstává (ScheduledTask.workoutLogId má onDelete SetNull).
    await prisma.activity.deleteMany({ where: { id: { in: activityIds }, userId } });
  }
  await prisma.subscription.delete({ where: { id: existing.id } });
}

/**
 * Potvrzení odběru (i úprava existujícího). Pro každý zapnutý prvek vznikne
 * aktivita + intervalový rozvrh; úkoly se dogenerují na ~8 týdnů dopředu.
 */
export async function subscribeToPackage(
  packageId: string,
  selections: ElementSelection[],
): Promise<void> {
  const userId = await requireUserId();
  const pkg = await prisma.package.findFirst({
    where: { id: packageId, OR: [{ published: true }, { authorId: userId }] },
    select: { id: true },
  });
  if (!pkg) return;

  await teardownSubscription(userId, packageId);

  const todayKey = dateKey(new Date());
  const start = keyToDate(todayKey);
  const sub = await prisma.subscription.create({
    data: { userId, packageId, startDate: start },
  });

  for (const sel of selections) {
    const interval = clampInterval(sel.intervalDays);
    const name = String(sel.name ?? "").trim().slice(0, 60) || "Prvek";
    if (!sel.enabled) {
      await prisma.subscriptionElement.create({
        data: {
          subscriptionId: sub.id,
          elementId: sel.elementId || null,
          name,
          color: color(sel.color),
          enabled: false,
          intervalDays: interval,
        },
      });
      continue;
    }
    const activity = await prisma.activity.create({
      data: { userId, name, color: color(sel.color) },
    });
    const schedule = await prisma.activitySchedule.create({
      data: { userId, activityId: activity.id, weekdays: [], intervalDays: interval, startDate: start },
    });
    await prisma.subscriptionElement.create({
      data: {
        subscriptionId: sub.id,
        elementId: sel.elementId || null,
        name,
        color: activity.color,
        enabled: true,
        intervalDays: interval,
        activityId: activity.id,
        scheduleId: schedule.id,
      },
    });
  }

  const end = keyToDate(todayKey);
  end.setUTCDate(end.getUTCDate() + 56);
  await ensureScheduleTasks(userId, todayKey, dateKey(end));

  revalidatePath("/balicky");
  revalidatePath("/kalendar");
}

/** Zrušení odběru → odebere vygenerované aktivity z kalendáře. */
export async function unsubscribePackage(packageId: string): Promise<void> {
  const userId = await requireUserId();
  await teardownSubscription(userId, packageId);
  revalidatePath("/balicky");
  revalidatePath("/kalendar");
}

// ===========================================================================
// Autorská tvorba balíčků
// ===========================================================================

const str = (v: unknown, max: number): string => String(v ?? "").trim().slice(0, max);
const clampInt = (v: unknown, min: number, max: number, fallback: number): number => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

function slugify(input: string): string {
  const base = input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
  return base || "balicek";
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = base;
  let i = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const hit = await prisma.package.findFirst({
      where: { slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
      select: { id: true },
    });
    if (!hit) return slug;
    i += 1;
    slug = `${base}-${i}`;
  }
}

export async function createPackage(): Promise<void> {
  const userId = await requireUserId();
  const slug = await uniqueSlug(`balicek-${Date.now().toString(36)}`);
  const pkg = await prisma.package.create({
    data: { slug, title: "Nový balíček", authorId: userId, category: "krasa", published: false },
    select: { slug: true },
  });
  redirect(`/balicky/${pkg.slug}/upravit`);
}

export async function updatePackageMeta(input: {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  category?: string;
  tags: string[];
  icon?: string;
  color: string;
  isFree: boolean;
  priceCzk?: number;
  published: boolean;
}): Promise<void> {
  const userId = await requireUserId();
  const owned = await prisma.package.findFirst({
    where: { id: input.id, authorId: userId },
    select: { id: true, title: true },
  });
  if (!owned) return;

  const title = str(input.title, 80) || "Bez názvu";
  const category =
    input.category && Object.keys(CATEGORY_LABELS).includes(input.category) ? input.category : null;
  const tags = [...new Set(input.tags.map((t) => str(t, 30).toLowerCase()).filter(Boolean))].slice(0, 12);
  const isFree = Boolean(input.isFree);
  const priceCents = isFree ? null : clampInt((input.priceCzk ?? 0) * 100, 0, 100_000_00, 0) || null;

  const newSlug = await uniqueSlug(slugify(title), input.id);

  await prisma.package.update({
    where: { id: input.id },
    data: {
      title,
      slug: newSlug,
      subtitle: str(input.subtitle, 120) || null,
      description: str(input.description, 2000) || null,
      category,
      tags,
      icon: str(input.icon, 8) || null,
      color: HEX.test(input.color) ? input.color : "#18181b",
      isFree,
      priceCents,
      published: Boolean(input.published),
    },
  });
  revalidatePath("/balicky");
  redirect(`/balicky/${newSlug}/upravit`);
}

export async function deletePackage(id: string): Promise<void> {
  const userId = await requireUserId();
  await prisma.package.deleteMany({ where: { id, authorId: userId } });
  revalidatePath("/balicky");
  redirect("/balicky");
}

export async function addPackageElement(packageId: string): Promise<void> {
  const userId = await requireUserId();
  const pkg = await prisma.package.findFirst({
    where: { id: packageId, authorId: userId },
    select: { id: true, color: true },
  });
  if (!pkg) return;
  const count = await prisma.packageElement.count({ where: { packageId } });
  await prisma.packageElement.create({
    data: {
      packageId,
      order: count,
      name: "Nový prvek",
      color: pkg.color,
      defaultIntervalDays: 28,
      optional: true,
    },
  });
  revalidatePath("/balicky");
}

export async function updatePackageElement(input: {
  id: string;
  name: string;
  note?: string;
  color: string;
  defaultIntervalDays: number;
  optional: boolean;
}): Promise<void> {
  const userId = await requireUserId();
  const el = await prisma.packageElement.findFirst({
    where: { id: input.id, package: { authorId: userId } },
    select: { id: true },
  });
  if (!el) return;
  await prisma.packageElement.update({
    where: { id: input.id },
    data: {
      name: str(input.name, 60) || "Prvek",
      note: str(input.note, 200) || null,
      color: HEX.test(input.color) ? input.color : "#18181b",
      defaultIntervalDays: clampInt(input.defaultIntervalDays, 1, 365, 28),
      optional: Boolean(input.optional),
    },
  });
  revalidatePath("/balicky");
}

export async function deletePackageElement(id: string): Promise<void> {
  const userId = await requireUserId();
  await prisma.packageElement.deleteMany({ where: { id, package: { authorId: userId } } });
  revalidatePath("/balicky");
}

export async function movePackageElement(id: string, dir: "up" | "down"): Promise<void> {
  const userId = await requireUserId();
  const el = await prisma.packageElement.findFirst({
    where: { id, package: { authorId: userId } },
    select: { id: true, order: true, packageId: true },
  });
  if (!el) return;
  const neighbor = await prisma.packageElement.findFirst({
    where:
      dir === "up"
        ? { packageId: el.packageId, order: { lt: el.order } }
        : { packageId: el.packageId, order: { gt: el.order } },
    orderBy: { order: dir === "up" ? "desc" : "asc" },
    select: { id: true, order: true },
  });
  if (!neighbor) return;
  await prisma.$transaction([
    prisma.packageElement.update({ where: { id: el.id }, data: { order: neighbor.order } }),
    prisma.packageElement.update({ where: { id: neighbor.id }, data: { order: el.order } }),
  ]);
  revalidatePath("/balicky");
}
