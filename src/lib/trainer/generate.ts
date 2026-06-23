import type {
  CategoryKey,
  Coop,
  Drill,
  DrillDatabase,
  GenerateOptions,
  Segment,
} from "./types";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "./types";

interface PhaseCfg {
  weight: number;
  roundSec: number;
  rest: (defaultRest: number) => number;
  maxRounds?: number;
}

const PHASE_CFG: Record<CategoryKey, PhaseCfg> = {
  warmup: { weight: 15, roundSec: 120, rest: (r) => Math.max(10, Math.round(r * 0.75)) },
  combinations: { weight: 35, roundSec: 180, rest: (r) => r },
  bag_work: { weight: 20, roundSec: 180, rest: (r) => r },
  sparring: { weight: 15, roundSec: 180, rest: (r) => r, maxRounds: 4 },
  conditioning: { weight: 15, roundSec: 45, rest: (r) => Math.max(5, Math.round(r * 0.4)) },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickPool(drills: Drill[], phase: CategoryKey, participants: number): Drill[] {
  if (participants <= 1) {
    const solo = drills.filter((d) => d.type === "solo" || d.type === "any");
    return solo.length ? solo : drills;
  }
  if (phase === "combinations" || phase === "sparring") {
    const pair = drills.filter((d) => d.type === "pair" || d.type === "any");
    return pair.length ? pair : drills;
  }
  return drills;
}

function repeatsFor(coop: Coop, participants: number): number {
  if (participants <= 1 || coop !== "cele_kolo") return 1;
  if (participants === 3) return 3;
  if (participants === 5) return 5;
  return 2;
}

const N = (names: string[] | undefined, i: number) => names?.[i]?.trim() || `${i + 1}`;

/** Rozdělení rolí pro dané kolo. Vrací čitelný text, nebo null pro sólo. */
export function getRolesForRound(
  roundIndex: number,
  participants: number,
  coop: Coop,
  names?: string[],
): string | null {
  if (participants <= 1) return null;
  const half = coop === "v_pulce";

  if (participants === 2) {
    const even = roundIndex % 2 === 0;
    const boxer = even ? N(names, 0) : N(names, 1);
    const feeder = even ? N(names, 1) : N(names, 0);
    return half
      ? `1. půlka — útok: ${boxer}, lapy: ${feeder} · 2. půlka prohození`
      : `Útok: ${boxer} · Lapy: ${feeder}`;
  }
  if (participants === 3) {
    const b = N(names, roundIndex % 3);
    const f = N(names, (roundIndex + 1) % 3);
    const bag = N(names, (roundIndex + 2) % 3);
    return half
      ? `1. půlka útok: ${b}, lapy: ${f} · 2. půlka prohození · Pytel: ${bag}`
      : `Útok: ${b} · Lapy: ${f} · Pytel: ${bag}`;
  }
  if (participants === 4) {
    const even = roundIndex % 2 === 0;
    const b1 = even ? N(names, 0) : N(names, 1);
    const f1 = even ? N(names, 1) : N(names, 0);
    const b2 = even ? N(names, 2) : N(names, 3);
    const f2 = even ? N(names, 3) : N(names, 2);
    return half
      ? `1. půlka útok: ${b1}, ${b2} · 2. půlka útok: ${f1}, ${f2}`
      : `Útok: ${b1}, ${b2} · Lapy: ${f1}, ${f2}`;
  }
  if (participants === 5) {
    const b1 = N(names, roundIndex % 5);
    const f1 = N(names, (roundIndex + 1) % 5);
    const b2 = N(names, (roundIndex + 2) % 5);
    const f2 = N(names, (roundIndex + 3) % 5);
    const bag = N(names, (roundIndex + 4) % 5);
    return `Útok: ${b1}, ${b2} · Lapy: ${f1}, ${f2} · Pytel: ${bag}`;
  }
  // 6
  const even = roundIndex % 2 === 0;
  const pairs = [
    [N(names, 0), N(names, 1)],
    [N(names, 2), N(names, 3)],
    [N(names, 4), N(names, 5)],
  ];
  const att = pairs.map((p) => (even ? p[0] : p[1])).join(", ");
  const fed = pairs.map((p) => (even ? p[1] : p[0])).join(", ");
  return `Útok: ${att} · Lapy: ${fed}`;
}

const coopHint = (coop: Coop): string =>
  coop === "v_pulce"
    ? "V půlce kola prohoďte role."
    : coop === "stridave"
      ? "Střídejte se po výzvě."
      : "";

/** Sestaví kompletní trénink jako pole segmentů. */
export function generateWorkout(db: DrillDatabase, opts: GenerateOptions): Segment[] {
  const totalSec = opts.durationMin * 60;
  const active = CATEGORY_ORDER.filter((k) => opts.phases[k] && (db[k]?.length ?? 0) > 0);
  const sumWeights = active.reduce((s, k) => s + PHASE_CFG[k].weight, 0) || 1;

  const out: Segment[] = [];
  out.push({
    kind: "prepare",
    name: "Příprava na trénink",
    voiceText: "Trénink začíná. Připravte se.",
    duration: 10,
  });

  let globalWorkIndex = 0;

  for (const phase of active) {
    const cfg = PHASE_CFG[phase];
    const targetTime = (cfg.weight / sumWeights) * totalSec;
    let roundSec = cfg.roundSec;
    if (phase === "sparring" && opts.durationMin < 30) roundSec = 120;
    const restSec = cfg.rest(opts.restSec);

    const pool = pickPool(db[phase], phase, opts.participants);
    let bag = shuffle(pool);
    let lastName = "";

    const phaseStartIdx = out.length;
    let acc = 0;
    let rounds = 0;

    while (acc < targetTime && (!cfg.maxRounds || rounds < cfg.maxRounds)) {
      if (bag.length === 0) {
        bag = shuffle(pool.filter((d) => d.name !== lastName));
        if (bag.length === 0) bag = shuffle(pool);
      }
      const drill = bag.shift()!;
      lastName = drill.name;

      const repeats = repeatsFor(drill.coop, opts.participants);
      for (let rep = 0; rep < repeats; rep++) {
        const roles = getRolesForRound(globalWorkIndex, opts.participants, drill.coop, opts.names);
        out.push({
          kind: "work",
          phase,
          name: drill.name,
          spokenName: drill.spokenName,
          voiceText: drill.voiceText,
          coop: drill.coop,
          duration: roundSec,
          roles,
        });
        out.push({
          kind: "rest",
          phase,
          name: "Pauza · vydýchání",
          duration: restSec,
        });
        globalWorkIndex++;
        rounds++;
        acc += roundSec + restSec;
        if (cfg.maxRounds && rounds >= cfg.maxRounds) break;
      }
    }

    // Doplnit čísla kol v rámci fáze.
    const workIdx = out
      .slice(phaseStartIdx)
      .map((s, i) => ({ s, i: phaseStartIdx + i }))
      .filter((x) => x.s.kind === "work");
    workIdx.forEach((x, i) => {
      out[x.i].roundNum = i + 1;
      out[x.i].totalRoundsInPhase = workIdx.length;
    });
  }

  // Odstranit poslední pauzu.
  if (out.length && out[out.length - 1].kind === "rest") out.pop();

  out.push({
    kind: "finish",
    name: "Konec tréninku",
    voiceText: "Trénink je u konce. Výborná práce. Konec tréninku.",
    duration: 5,
  });

  annotateSegments(out);
  return out;
}

/**
 * Doplní do segmentů „následuje" (`nextName`) a vygeneruje hlasový text pauz
 * (ohlášení dalšího kola). Sdílené generátorem i kompilátorem autorovaných
 * tréninků – mutuje pole na místě.
 */
export function annotateSegments(out: Segment[]): void {
  for (let i = 0; i < out.length; i++) {
    const next = out[i + 1];
    out[i].nextName = next ? next.name : undefined;
    if (out[i].kind === "rest") {
      // najít nejbližší další work (jen pro vizuální „Následuje")
      const nw = out.slice(i + 1).find((s) => s.kind === "work");
      if (nw) out[i].nextName = nw.name;
      // Pokyn dalšího cviku se NEČTE v pauze – zazní (MP3/hlas) až na startu
      // toho cviku. Pasivní pauza tak nečte nic; aktivní (kondiční) má vlastní pokyn.
    }
  }
}

export function workoutTotals(segments: Segment[]) {
  let work = 0;
  let rest = 0;
  let rounds = 0;
  for (const s of segments) {
    if (s.kind === "work") {
      work += s.duration;
      rounds++;
    } else if (s.kind === "rest" || s.kind === "prepare" || s.kind === "finish") {
      rest += s.duration;
    }
  }
  return { totalSec: work + rest, workSec: work, restSec: rest, rounds };
}

export function phaseLabel(s: Segment): string {
  if (s.kind === "prepare") return "Příprava";
  if (s.kind === "finish") return "Konec";
  if (s.kind === "rest") return "Pauza";
  return s.phase ? CATEGORY_LABELS[s.phase] : "Kolo";
}

export function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
