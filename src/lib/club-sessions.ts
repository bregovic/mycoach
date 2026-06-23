// Server helper: dogeneruje termíny (ClubSession) z aktivních rozvrhů oddílu
// pro daný rozsah dat. Idempotentní díky unique (clubId, date, startMin).
import { prisma } from "@/lib/prisma";
import { keyToDate, scheduleDatesInRange } from "@/lib/calendar";

export async function ensureClubSessions(
  clubId: string,
  rangeStartKey: string,
  rangeEndKey: string,
): Promise<void> {
  const rules = await prisma.clubScheduleRule.findMany({ where: { clubId, active: true } });
  if (rules.length === 0) return;

  const rows: { clubId: string; ruleId: string; date: Date; startMin: number; endMin: number }[] = [];
  for (const r of rules) {
    const dates = scheduleDatesInRange(r.weekdays, rangeStartKey, null, rangeStartKey, rangeEndKey);
    for (const dk of dates) {
      rows.push({ clubId, ruleId: r.id, date: keyToDate(dk), startMin: r.startMin, endMin: r.endMin });
    }
  }
  if (rows.length > 0) {
    await prisma.clubSession.createMany({ data: rows, skipDuplicates: true });
  }
}
