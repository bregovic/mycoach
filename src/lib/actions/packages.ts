"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { dateKey, keyToDate } from "@/lib/calendar";
import { ensureScheduleTasks } from "@/lib/calendar-tasks";

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
