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
  restBetweenItems?: boolean;
  items: AuthoredItem[];
  // aktivní pauza mezi koly (kondiční cvik); není-li, klasické vydýchání
  restName?: string | null;
  restSpokenName?: string | null;
  restVoiceText?: string | null;
  restAudioKey?: string | null;
}

export interface AuthoredTraining {
  title: string;
  prepareSec: number;
  betweenBlocksSec?: number; // pauza mezi bloky (zvlášť od pauz v bloku)
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
  // Příprava: respektuj 0 (= bez přípravy); jen když není zadaná vůbec, použij 10.
  const prep = Number.isFinite(t.prepareSec) ? Math.max(0, t.prepareSec) : 10;
  if (prep > 0) {
    out.push({
      kind: "prepare",
      name: "Příprava na trénink",
      voiceText: "Trénink začíná. Připravte se.",
      duration: Math.max(3, prep),
    });
  }

  for (const block of t.blocks) {
    const phase = asCategory(block.category);
    const rounds = Math.max(1, block.rounds || 1);
    const items = block.items.filter((it) => (it.durationSec ?? 0) > 0);
    if (items.length === 0) continue;

    // Pauza bloku – aktivní (kondiční cvik) nebo klasické vydýchání.
    const pushRest = () => {
      if (block.restSec <= 0) return;
      if (block.restName) {
        out.push({
          kind: "rest",
          phase,
          name: block.restName,
          spokenName: (block.restSpokenName ?? "").trim() || block.restName,
          voiceText: `${(block.restSpokenName ?? "").trim() || block.restName}. ${block.restVoiceText ?? ""}`.trim(),
          audioUrl: audioUrlOf(block.restAudioKey),
          duration: block.restSec,
        });
      } else {
        out.push({ kind: "rest", phase, name: "Pauza · vydýchání", duration: block.restSec });
      }
    };

    // Pauzu vkládej i mezi jednotlivé cviky, když je to zapnuté NEBO když má blok
    // aktivní pauzu (kondiční cvik) – ten patří právě do pauz mezi cviky/kombinacemi.
    const betweenItems = block.restBetweenItems || !!block.restName;

    const blockStartIdx = out.length;
    for (let r = 0; r < rounds; r++) {
      items.forEach((it, idx) => {
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
        // pauza i mezi cviky v kole (ne za posledním cvikem kola)
        if (betweenItems && idx < items.length - 1) pushRest();
      });
      // pauza mezi koly bloku (ne za posledním kolem)
      if (r < rounds - 1) pushRest();
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

    // Pauza mezi bloky (zvlášť nastavitelná; oříznutá, pokud je poslední).
    const betweenBlocks = Number.isFinite(t.betweenBlocksSec) ? Math.max(0, t.betweenBlocksSec as number) : 60;
    if (betweenBlocks > 0) {
      out.push({ kind: "rest", phase, name: "Pauza mezi bloky", duration: betweenBlocks });
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
