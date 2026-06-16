import raw from "@/data/box-drills.json";
import type { Coop, Drill, DrillDatabase, CategoryKey } from "./types";
import { CATEGORY_ORDER } from "./types";

// JSON může mít coop s diakritikou ("celé_kolo") – normalizujeme.
function normCoop(v: unknown): Coop {
  const s = String(v ?? "najednou")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
  if (s === "stridave") return "stridave";
  if (s === "v_pulce") return "v_pulce";
  if (s === "cele_kolo") return "cele_kolo";
  return "najednou";
}

function toDrills(arr: unknown): Drill[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((d) => ({
    name: String(d.name ?? ""),
    spokenName: String(d.spokenName ?? d.name ?? ""),
    coop: normCoop(d.coop),
    voiceText: String(d.voiceText ?? ""),
    type: d.type === "solo" || d.type === "pair" ? d.type : "any",
  }));
}

const db = raw as Record<string, unknown>;

export const BOX_DRILLS: DrillDatabase = CATEGORY_ORDER.reduce((acc, key) => {
  acc[key] = toDrills(db[key]);
  return acc;
}, {} as DrillDatabase);

export function drillCount(database: DrillDatabase): Record<CategoryKey, number> {
  return CATEGORY_ORDER.reduce((acc, key) => {
    acc[key] = database[key]?.length ?? 0;
    return acc;
  }, {} as Record<CategoryKey, number>);
}
