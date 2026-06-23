// Kompilace autorovaného (ručně složeného) tréninku na pole segmentů, které
// přehrává stejný engine jako procedurální generátor (viz generate.ts).
//
// Hierarchie: Training → Block[] → BlockItem[].
//  - každý BlockItem = jeden pracovní úsek (work) s vlastní délkou,
//  - blok se může zopakovat `rounds`× s pauzou `restSec` mezi koly,
//  - mezi bloky se vkládá pauza (poslední pauza se ořízne, na konci „finish").

import type { CategoryKey, Coop, Segment } from "./types";
import { annotateSegments } from "./generate";
import { CATEGORY_ORDER } from "./types";

export interface AuthoredItem {
  name: string;
  spokenName?: string | null;
  voiceText?: string | null;
  coop?: string | null;
  durationSec: number;
  audioKey?: string | null; // MP3 instrukce v úložišti
}

/** URL pro přehrání MP3 instrukce (servíruje přihlášený endpoint). */
function audioUrlOf(key?: string | null): string | undefined {
  return key ? `/api/exercise-audio?key=${encodeURIComponent(key)}` : undefined;
}

export interface AuthoredBlock {
  title: string;
  category?: string | null;
  rounds: number;
  restSec: number;
  items: AuthoredItem[];
}

export interface AuthoredTraining {
  title: string;
  prepareSec: number;
  blocks: AuthoredBlock[];
}

function normCoop(v?: string | null): Coop {
  const s = String(v ?? "najednou")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
  if (s === "stridave") return "stridave";
  if (s === "v_pulce") return "v_pulce";
  if (s === "cele_kolo") return "cele_kolo";
  return "najednou";
}

function asCategory(v?: string | null): CategoryKey | undefined {
  return (CATEGORY_ORDER as string[]).includes(v ?? "") ? (v as CategoryKey) : undefined;
}

/** Sestaví trénink z autorované struktury jako pole segmentů pro přehrávač. */
export function compileTraining(t: AuthoredTraining): Segment[] {
  const out: Segment[] = [];
  out.push({
    kind: "prepare",
    name: "Příprava na trénink",
    voiceText: "Trénink začíná. Připravte se.",
    duration: Math.max(3, t.prepareSec || 10),
  });

  for (const block of t.blocks) {
    const phase = asCategory(block.category);
    const rounds = Math.max(1, block.rounds || 1);
    const items = block.items.filter((it) => (it.durationSec ?? 0) > 0);
    if (items.length === 0) continue;

    const blockStartIdx = out.length;
    for (let r = 0; r < rounds; r++) {
      for (const it of items) {
        out.push({
          kind: "work",
          phase,
          name: it.name,
          spokenName: (it.spokenName ?? "").trim() || it.name,
          voiceText: it.voiceText ?? "",
          coop: normCoop(it.coop),
          duration: it.durationSec,
          audioUrl: audioUrlOf(it.audioKey),
        });
      }
      // pauza mezi koly bloku (ne za posledním kolem)
      if (r < rounds - 1 && block.restSec > 0) {
        out.push({ kind: "rest", phase, name: "Pauza · vydýchání", duration: block.restSec });
      }
    }

    // Číslování kol v rámci bloku.
    const works = out
      .slice(blockStartIdx)
      .map((sg, i) => ({ sg, i: blockStartIdx + i }))
      .filter((x) => x.sg.kind === "work");
    works.forEach((x, i) => {
      out[x.i].roundNum = i + 1;
      out[x.i].totalRoundsInPhase = works.length;
    });

    // Pauza mezi bloky (oříznutá, pokud je poslední).
    if (block.restSec > 0) {
      out.push({ kind: "rest", phase, name: "Pauza mezi bloky", duration: block.restSec });
    }
  }

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
