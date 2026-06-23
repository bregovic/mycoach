// Čisté pomocné funkce pro tréninkový kalendář (bez DB, bez Reactu).
// Datum řešíme striktně v UTC – Prisma @db.Date vrací půlnoc UTC.

export type Preset = { slug: string; name: string; color: string };

export const PRESET_ACTIVITIES: Preset[] = [
  { slug: "box", name: "Box", color: "#ef4444" },
  { slug: "beh", name: "Běh", color: "#22c55e" },
  { slug: "posilovna", name: "Posilovna", color: "#3b82f6" },
  { slug: "kolo", name: "Kolo", color: "#f59e0b" },
  { slug: "plavani", name: "Plavání", color: "#06b6d4" },
  { slug: "joga", name: "Jóga", color: "#a855f7" },
];

// Pondělím počínaje (JS getDay: 0=Ne … 6=So).
export const WEEKDAYS = [
  { value: 1, short: "Po" },
  { value: 2, short: "Út" },
  { value: 3, short: "St" },
  { value: 4, short: "Čt" },
  { value: 5, short: "Pá" },
  { value: 6, short: "So" },
  { value: 0, short: "Ne" },
];

export function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function keyToDate(key: string): Date {
  return new Date(key + "T00:00:00.000Z");
}

/** Mřížka 6×7 (dateKeys), pondělím počínaje, vč. přesahů sousedních měsíců. */
export function monthMatrix(year: number, month0: number): string[][] {
  const first = new Date(Date.UTC(year, month0, 1));
  const lead = (first.getUTCDay() + 6) % 7; // kolik dní doplnit před 1.
  const cur = new Date(first);
  cur.setUTCDate(1 - lead);
  const weeks: string[][] = [];
  for (let w = 0; w < 6; w++) {
    const row: string[] = [];
    for (let d = 0; d < 7; d++) {
      row.push(dateKey(cur));
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    weeks.push(row);
  }
  return weeks;
}

/** Dny (dateKeys) spadající do rozsahu, kde getUTCDay ∈ weekdays. */
export function scheduleDatesInRange(
  weekdays: number[],
  startKey: string,
  endKey: string | null,
  rangeStartKey: string,
  rangeEndKey: string,
): string[] {
  const set = new Set(weekdays);
  const from = startKey > rangeStartKey ? startKey : rangeStartKey;
  const toRaw = endKey && endKey < rangeEndKey ? endKey : rangeEndKey;
  const out: string[] = [];
  const cur = keyToDate(from);
  const end = keyToDate(toRaw);
  while (cur <= end) {
    if (set.has(cur.getUTCDay())) out.push(dateKey(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

/** Dny (dateKeys) opakování po `intervalDays` od startKey, spadající do rozsahu. */
export function intervalDatesInRange(
  startKey: string,
  intervalDays: number,
  endKey: string | null,
  rangeStartKey: string,
  rangeEndKey: string,
): string[] {
  if (intervalDays <= 0) return [];
  const DAY = 86_400_000;
  const start = keyToDate(startKey);
  const rangeStart = keyToDate(rangeStartKey);
  const hardEnd = endKey ? keyToDate(endKey) : null;
  const rangeEnd = keyToDate(rangeEndKey);
  const end = hardEnd && hardEnd < rangeEnd ? hardEnd : rangeEnd;

  // Posuň na první výskyt ≥ začátek viditelného rozsahu (zachová fázi od startKey).
  const cur = new Date(start);
  if (cur < rangeStart) {
    const steps = Math.ceil((rangeStart.getTime() - start.getTime()) / DAY / intervalDays);
    cur.setUTCDate(cur.getUTCDate() + steps * intervalDays);
  }

  const out: string[] = [];
  while (cur <= end) {
    if (cur >= start) out.push(dateKey(cur));
    cur.setUTCDate(cur.getUTCDate() + intervalDays);
  }
  return out;
}

/** "YYYY-MM" → {year, month0}; neplatné/prázdné → aktuální měsíc. */
export function parseMonthParam(month: string | undefined): { year: number; month0: number } {
  const m = month?.match(/^(\d{4})-(\d{2})$/);
  if (m) {
    const year = Number(m[1]);
    const month0 = Number(m[2]) - 1;
    if (month0 >= 0 && month0 <= 11) return { year, month0 };
  }
  const now = new Date();
  return { year: now.getUTCFullYear(), month0: now.getUTCMonth() };
}

export function monthParam(year: number, month0: number): string {
  return `${year}-${String(month0 + 1).padStart(2, "0")}`;
}

export function shiftMonth(year: number, month0: number, delta: number): { year: number; month0: number } {
  const total = year * 12 + month0 + delta;
  return { year: Math.floor(total / 12), month0: ((total % 12) + 12) % 12 };
}
