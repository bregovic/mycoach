"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { keyToDate, dateKey } from "@/lib/calendar";
import { ensureScheduleTasks } from "@/lib/calendar-tasks";

async function requireUserId(): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new Error("Neautorizováno.");
  return id;
}

const HEX = /^#[0-9a-fA-F]{6}$/;

// --- Aktivity -------------------------------------------------------------

export async function createActivity(input: { name: string; color: string; sportSlug?: string | null }) {
  const userId = await requireUserId();
  const name = input.name.trim().slice(0, 60);
  if (!name) return;
  const color = HEX.test(input.color) ? input.color : "#18181b";
  await prisma.activity.create({
    data: { userId, name, color, sportSlug: input.sportSlug ?? null },
  });
  revalidatePath("/kalendar");
}

export async function deleteActivity(id: string) {
  const userId = await requireUserId();
  // Cascade smaže i rozvrhy a úkoly aktivity (vč. dokončených úkolů).
  await prisma.activity.deleteMany({ where: { id, userId } });
  revalidatePath("/kalendar");
}

// --- Ruční úkoly ----------------------------------------------------------

export async function addManualTask(input: {
  activityId: string;
  dateKey: string;
  note?: string;
  durationMin?: number | null;
}) {
  const userId = await requireUserId();
  const activity = await prisma.activity.findFirst({
    where: { id: input.activityId, userId },
    select: { id: true },
  });
  if (!activity) return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.dateKey)) return;

  await prisma.scheduledTask.create({
    data: {
      userId,
      activityId: activity.id,
      date: keyToDate(input.dateKey),
      note: input.note?.trim().slice(0, 200) || null,
      durationMin: input.durationMin && input.durationMin > 0 ? Math.round(input.durationMin) : null,
    },
  });
  revalidatePath("/kalendar");
}

export async function deleteTask(id: string) {
  const userId = await requireUserId();
  const task = await prisma.scheduledTask.findFirst({
    where: { id, userId },
    select: { id: true, workoutLogId: true },
  });
  if (!task) return;
  if (task.workoutLogId) {
    await prisma.workoutLog.deleteMany({ where: { id: task.workoutLogId, userId } });
  }
  await prisma.scheduledTask.deleteMany({ where: { id, userId } });
  revalidatePath("/kalendar");
}

export async function setTaskDone(id: string, done: boolean) {
  const userId = await requireUserId();
  const task = await prisma.scheduledTask.findFirst({
    where: { id, userId },
    include: { activity: { select: { name: true } } },
  });
  if (!task) return;

  if (done) {
    let workoutLogId = task.workoutLogId;
    if (!workoutLogId) {
      const log = await prisma.workoutLog.create({
        data: {
          userId,
          date: task.date,
          title: task.activity.name,
          durationMin: task.durationMin ?? null,
          note: task.note ?? null,
        },
      });
      workoutLogId = log.id;
    }
    await prisma.scheduledTask.update({
      where: { id: task.id },
      data: { done: true, completedAt: new Date(), workoutLogId },
    });
  } else {
    if (task.workoutLogId) {
      await prisma.workoutLog.deleteMany({ where: { id: task.workoutLogId, userId } });
    }
    await prisma.scheduledTask.update({
      where: { id: task.id },
      data: { done: false, completedAt: null, workoutLogId: null },
    });
  }
  revalidatePath("/kalendar");
}

// --- Opakovaný rozvrh -----------------------------------------------------

export async function createSchedule(input: {
  activityId: string;
  weekdays: number[];
  startKey?: string;
}) {
  const userId = await requireUserId();
  const activity = await prisma.activity.findFirst({
    where: { id: input.activityId, userId },
    select: { id: true },
  });
  if (!activity) return;

  const weekdays = [...new Set(input.weekdays)].filter((d) => d >= 0 && d <= 6).sort();
  if (weekdays.length === 0) return;

  const startKey =
    input.startKey && /^\d{4}-\d{2}-\d{2}$/.test(input.startKey)
      ? input.startKey
      : dateKey(new Date());

  const schedule = await prisma.activitySchedule.create({
    data: { userId, activityId: activity.id, weekdays, startDate: keyToDate(startKey) },
  });

  // Dogeneruj úkoly na ~8 týdnů dopředu, ať se rovnou objeví.
  const end = keyToDate(startKey);
  end.setUTCDate(end.getUTCDate() + 56);
  await ensureScheduleTasks(userId, startKey, dateKey(end));

  revalidatePath("/kalendar");
  return schedule.id;
}

export async function deleteSchedule(id: string) {
  const userId = await requireUserId();
  const schedule = await prisma.activitySchedule.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!schedule) return;
  // Smaž budoucí nesplněné úkoly z rozvrhu; splněné (historie) ponech.
  await prisma.scheduledTask.deleteMany({ where: { scheduleId: id, userId, done: false } });
  await prisma.activitySchedule.deleteMany({ where: { id, userId } });
  revalidatePath("/kalendar");
}
