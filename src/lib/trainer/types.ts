// Obecný intervalový trenér – datové typy.
// Disciplína = sada kategorií cviků; engine je sport-agnostický.

export type CategoryKey =
  | "warmup"
  | "combinations"
  | "bag_work"
  | "sparring"
  | "conditioning";

/** Režim spolupráce více cvičících v jednom kole. */
export type Coop = "najednou" | "stridave" | "v_pulce" | "cele_kolo";

/** Pro koho je cvik vhodný podle počtu lidí. */
export type DrillType = "any" | "solo" | "pair";

export interface Drill {
  name: string; // zobrazený název (může obsahovat jména/anglicismy)
  spokenName: string; // čistá česká fráze pro hlas
  coop: Coop;
  voiceText: string; // detailní pokyn čtený v pauze
  type: DrillType;
}

export type DrillDatabase = Record<CategoryKey, Drill[]>;

export type SegmentKind = "prepare" | "work" | "rest" | "finish";

export interface Segment {
  kind: SegmentKind;
  phase?: CategoryKey;
  name: string;
  spokenName?: string;
  voiceText?: string;
  coop?: Coop;
  duration: number; // sekundy
  roles?: string | null;
  roundNum?: number; // pořadí kola v rámci fáze
  totalRoundsInPhase?: number;
  nextName?: string; // název následujícího segmentu (doplněno po sestavení)
  audioUrl?: string; // MP3 instrukce – přehraje se místo čtení (TTS)
}

export interface GenerateOptions {
  participants: number; // 1–6
  durationMin: number; // celková délka tréninku
  restSec: number; // výchozí pauza mezi koly
  phases: Record<CategoryKey, boolean>; // které fáze zařadit
  names?: string[]; // volitelná jména cvičících
}

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  warmup: "Rozcvička",
  combinations: "Kombinace",
  bag_work: "Pytel",
  sparring: "Sparring",
  conditioning: "Kondice",
};

export const CATEGORY_ORDER: CategoryKey[] = [
  "warmup",
  "combinations",
  "bag_work",
  "sparring",
  "conditioning",
];
