// Serverový helper: dogeneruje ScheduledTask z aktivních rozvrhů pro rozsah dat.
// Idempotentní – spoléhá na unique (scheduleId, date) + skipDuplicates.

import { prisma } from "@/lib/prisma";
import { keyToDate, scheduleDatesInRange } from "@/lib/calendar";

export async function ensureScheduleTasks(
  userId: string,
  rangeStartKey: string,
  rangeEndKey: string,
): Promise<void> {
  const schedules = await prisma.activitySchedule.findMany({
    where: { userId, active: true },
  });
  if (schedules.length === 0) return;

  const rows: {
    userId: string;
    activityId: string;
    scheduleId: string;
    date: Date;
  }[] = [];

  for (const s of schedules) {
    const startKey = s.startDate.toISOString().slice(0, 10);
    const endKey = s.endDate ? s.endDate.toISOString().slice(0, 10) : null;
    const dates = scheduleDatesInRange(s.weekdays, startKey, endKey, rangeStartKey, rangeEndKey);
    for (const dk of dates) {
      rows.push({ userId, activityId: s.activityId, scheduleId: s.id, date: keyToDate(dk) });
    }
  }

  if (rows.length > 0) {
    await prisma.scheduledTask.createMany({ data: rows, skipDuplicates: true });
  }
}
