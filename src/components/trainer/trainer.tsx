"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Brand } from "@/components/brand";
import { BOX_DRILLS, drillCount } from "@/lib/trainer/drills";
import { formatTime, generateWorkout, phaseLabel, workoutTotals } from "@/lib/trainer/generate";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/trainer/types";
import type { CategoryKey, Segment } from "@/lib/trainer/types";
import { logCompletedWorkout } from "@/lib/actions/trainings";
import { useAudio } from "./use-audio";
import { useSpeech } from "./use-speech";

const card = "rounded-2xl border border-zinc-200 bg-white p-6";
const inputCls =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500";

// Barevné ladění karty časovače podle typu úseku.
const STATE: Record<Segment["kind"], { ring: string; bar: string; text: string; tag: string }> = {
  work: { ring: "ring-red-300", bar: "bg-red-500", text: "text-red-600", tag: "bg-red-50 text-red-700" },
  rest: { ring: "ring-emerald-300", bar: "bg-emerald-500", text: "text-emerald-600", tag: "bg-emerald-50 text-emerald-700" },
  prepare: { ring: "ring-amber-300", bar: "bg-amber-500", text: "text-amber-600", tag: "bg-amber-50 text-amber-700" },
  finish: { ring: "ring-amber-300", bar: "bg-amber-500", text: "text-amber-600", tag: "bg-amber-50 text-amber-700" },
};

function findNextWork(segs: Segment[], from: number): Segment | null {
  for (let j = from + 1; j < segs.length; j++) if (segs[j].kind === "work") return segs[j];
  return null;
}

/** Předpřipravený (autorovaný) trénink k přehrání místo procedurálního generování. */
export interface TrainerPreset {
  title: string;
  sportSlug?: string | null;
  segments: Segment[];
}

function Shell({ right, children }: { right: ReactNode; children: ReactNode }) {
  return (
    <main className="min-h-dvh overflow-x-hidden bg-gradient-to-b from-zinc-50 to-zinc-100/40">
      <header className="sticky top-0 z-20 border-b border-zinc-200/80 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/dashboard" className="transition hover:opacity-80">
            <Brand />
          </Link>
          {right}
        </div>
      </header>
      <section className="mx-auto max-w-4xl px-3 py-4 sm:px-6 sm:py-10">{children}</section>
    </main>
  );
}

export function Trainer({
  userName,
  preset,
  cues,
}: {
  userName: string;
  preset?: TrainerPreset | null;
  cues?: Record<string, string[]>;
}) {
  const [participants, setParticipants] = useState(1);
  const [durationMin, setDurationMin] = useState(40);
  const [restSec, setRestSec] = useState(20);
  const [phases, setPhases] = useState<Record<CategoryKey, boolean>>({
    warmup: true,
    combinations: true,
    bag_work: true,
    sparring: false,
    conditioning: true,
  });
  const [names, setNames] = useState<string[]>(["", "", "", "", "", ""]);

  const [segments, setSegments] = useState<Segment[]>([]);
  const [index, setIndex] = useState(-1);
  const [timeLeft, setTimeLeft] = useState(0);
  const [running, setRunning] = useState(false);

  const audio = useAudio();
  const speech = useSpeech();
  const counts = useMemo(() => drillCount(BOX_DRILLS), []);

  const started = index >= 0 && index < segments.length;
  const seg = started ? segments[index] : null;
  const totals = useMemo(() => workoutTotals(segments), [segments]);

  const idxRef = useRef(index);
  idxRef.current = index;
  const tlRef = useRef(timeLeft);
  tlRef.current = timeLeft;
  const segsRef = useRef(segments);
  segsRef.current = segments;
  const tickRef = useRef<() => void>(() => {});
  const activeSegRef = useRef<HTMLDivElement | null>(null);
  const completedRef = useRef(false);

  // Po přirozeném dokončení tréninku ulož záznam do historie (WorkoutLog).
  const logMeta = preset
    ? { title: preset.title, sportSlug: preset.sportSlug ?? null }
    : { title: "Hlasový trénink", sportSlug: "box" };
  const logMetaRef = useRef(logMeta);
  logMetaRef.current = logMeta;

  const instrRef = useRef<HTMLAudioElement | null>(null);
  const cueRef = useRef<HTMLAudioElement | null>(null);
  const cuesRef = useRef<Record<string, string[]>>(cues ?? {});
  cuesRef.current = cues ?? {};

  // Předohlášení: instrukce dalšího cviku se přehraje během pauzy, načasovaná
  // tak, aby skončila zhruba se startem cviku (plynulé navázání).
  const preRef = useRef<{ work: Segment | null; leadSec: number; announced: boolean }>({
    work: null,
    leadSec: 0,
    announced: false,
  });
  const preAudioRef = useRef<HTMLAudioElement | null>(null);
  const workPreannouncedRef = useRef(false);

  // Přehraje náhodný uživatelský zvukový pokyn daného typu. Vrací, zda něco hrálo.
  const playCue = useCallback((type: string): boolean => {
    const arr = cuesRef.current[type];
    if (!arr || arr.length === 0) return false;
    const url = arr[Math.floor(Math.random() * arr.length)];
    try {
      if (!cueRef.current) cueRef.current = new Audio();
      cueRef.current.onended = null;
      cueRef.current.src = url;
      void cueRef.current.play().catch(() => {});
    } catch {
      /* ignore */
    }
    return true;
  }, []);

  // Přehraje cue a po jeho dokončení zavolá onEnd (sekvenčně, ať se nepřekrývá
  // s instrukcí). Když cue není, vrátí false (onEnd nezavolá – řeší volající).
  const playCueThen = useCallback((type: string, onEnd: () => void): boolean => {
    const arr = cuesRef.current[type];
    if (!arr || arr.length === 0) return false;
    const url = arr[Math.floor(Math.random() * arr.length)];
    try {
      if (!cueRef.current) cueRef.current = new Audio();
      const done = () => {
        if (cueRef.current) cueRef.current.onended = null;
        onEnd();
      };
      cueRef.current.onended = done;
      cueRef.current.onerror = done;
      cueRef.current.src = url;
      void cueRef.current.play().catch(done);
    } catch {
      onEnd();
    }
    return true;
  }, []);

  // „Start" zvuk úseku – nahraný technický cue, jinak gong.
  const playStartCue = useCallback(
    (sg: Segment) => {
      let cuePlayed = false;
      if (sg.kind === "prepare") cuePlayed = playCue("start");
      else if (sg.kind === "work") cuePlayed = playCue("round_start");
      else if (sg.kind === "rest") cuePlayed = playCue("round_end") || playCue("rest");
      else if (sg.kind === "finish") cuePlayed = playCue("finish");
      if (!cuePlayed) audio.playBell(sg.kind === "prepare" || sg.kind === "finish");
    },
    [audio, playCue],
  );

  // Coop pokyn (jak se cvik dělá) – přednostně tvůj MP3 cue, jinak hlas. Individuální = nic.
  const announceCoop = useCallback(
    (sg: Segment) => {
      if (sg.kind !== "work") return;
      if (sg.coop === "stridave") {
        if (!playCue("switch")) speech.speak("Střídejte se.");
      } else if (sg.coop === "v_pulce") {
        if (!playCue("half_swap")) speech.speak("V půlce se na znamení vyměníte.");
      } else if (sg.coop === "cele_kolo") {
        if (!playCue("half_swap")) speech.speak("Celé kolo jeden, pak se vyměníte.");
      }
    },
    [playCue, speech],
  );

  // Přečte instrukci úseku (nahraná MP3 má přednost před TTS). Po instrukci zazní
  // coop pokyn. onDone se zavolá po dočtení (nebo hned, je-li ztišeno/prázdné).
  const readInstruction = useCallback(
    (sg: Segment, onDone?: () => void) => {
      if (sg.audioUrl) {
        if (speech.muted) {
          onDone?.();
          return;
        }
        const after = () => {
          announceCoop(sg);
          onDone?.();
        };
        try {
          if (!instrRef.current) instrRef.current = new Audio();
          instrRef.current.pause();
          instrRef.current.onended = after;
          instrRef.current.onerror = after;
          instrRef.current.src = sg.audioUrl;
          void instrRef.current.play().catch(after);
        } catch {
          after();
        }
        return;
      }
      const base = sg.kind === "work" ? `${sg.spokenName}. ${sg.voiceText ?? ""}` : sg.voiceText ?? "";
      speech.speak(base, () => {
        announceCoop(sg);
        onDone?.();
      });
    },
    [speech, announceCoop],
  );


  const goTo = useCallback(
    (i: number) => {
      const segs = segsRef.current;
      // ukliď naplánované předohlášení
      preRef.current = { work: null, leadSec: 0, announced: false };
      if (preAudioRef.current) {
        try {
          preAudioRef.current.pause();
        } catch {
          /* ignore */
        }
      }
      if (i < 0 || i >= segs.length) {
        // Konec přehrávání. Pokud trénink doběhl přirozeně (ne ručním ukončením),
        // ulož ho jednou do historie.
        if (!completedRef.current && idxRef.current >= 0 && segs.length > 1) {
          completedRef.current = true;
          const t = workoutTotals(segs);
          if (t.rounds > 0) {
            void logCompletedWorkout({
              title: logMetaRef.current.title,
              sportSlug: logMetaRef.current.sportSlug,
              durationMin: Math.round(t.totalSec / 60),
              rounds: t.rounds,
            }).catch(() => {});
          }
        }
        setRunning(false);
        setIndex(-1);
        setSegments([]);
        speech.cancel();
        return;
      }
      const sg = segs[i];
      const kickoff = idxRef.current < 0; // úplný začátek tréninku
      setIndex(i);
      setTimeLeft(sg.duration);

      if (sg.kind === "work") {
        // Na úplném začátku „start", jinak „round_start".
        const cueType = kickoff ? "start" : "round_start";
        const wasPre = workPreannouncedRef.current;
        workPreannouncedRef.current = false;
        if (wasPre) {
          // instrukce už zazněla v pauze → jen cue (žádné čtení přes sebe)
          if (!playCue(cueType)) audio.playBell(false);
        } else if (!playCueThen(cueType, () => readInstruction(sg))) {
          // žádný cue → gong a hned instrukce
          audio.playBell(false);
          readInstruction(sg);
        }
        return;
      }

      // pauza / příprava / konec – cue + vlastní pokyn (aktivní pauza = kondiční cvik)
      playStartCue(sg);
      readInstruction(sg);

      // Naplánuj ohlášení dalšího cviku během pauzy (ať navazuje na jeho start).
      if (sg.kind === "rest" || sg.kind === "prepare") {
        const nw = findNextWork(segs, i);
        if (nw) {
          if (nw.audioUrl) {
            // přednačti, ať odhadneme délku MP3 a spustíme ji včas
            preRef.current = { work: nw, leadSec: Math.min(sg.duration - 1, 9), announced: false };
            const a = new Audio();
            a.preload = "metadata";
            a.onloadedmetadata = () => {
              const d = Number.isFinite(a.duration) ? a.duration : 8;
              preRef.current.leadSec = Math.min(sg.duration - 1, Math.ceil(d) + 2);
            };
            a.src = nw.audioUrl;
            preAudioRef.current = a;
          } else {
            const words = `${nw.spokenName} ${nw.voiceText ?? ""}`.trim().split(/\s+/).filter(Boolean).length;
            const lead = Math.min(sg.duration - 1, Math.max(3, Math.round(words * 0.5) + 1));
            preRef.current = { work: nw, leadSec: lead, announced: false };
          }
        }
      }
    },
    [playStartCue, readInstruction, playCue, playCueThen, audio, speech],
  );

  // jeden tick za sekundu (čte aktuální stav přes refy)
  tickRef.current = () => {
    const i = idxRef.current;
    const segs = segsRef.current;
    const sg = segs[i];
    if (!sg) return;
    const next = tlRef.current - 1;
    if (next <= 0) {
      goTo(i + 1);
      return;
    }
    setTimeLeft(next);

    // Předohlášení dalšího cviku během pauzy (načasované podle délky instrukce).
    if (sg.kind === "rest" || sg.kind === "prepare") {
      const pre = preRef.current;
      if (pre.work && !pre.announced && pre.leadSec > 0 && next <= pre.leadSec) {
        pre.announced = true;
        workPreannouncedRef.current = true;
        readInstruction(pre.work);
      }
    }

    if (next <= 5) audio.playTick();
    // Mluvený odpočet jen na konci cvičení (ne v pauze před startem cviku).
    if (next === 5 && sg.kind === "work") playCue("countdown");
    if (sg.kind === "work" && sg.duration > 20 && next === Math.floor(sg.duration / 2)) {
      if (sg.coop === "v_pulce") {
        if (!playCue("half_swap")) {
          audio.playBell(false);
          speech.speak("Výměna rolí.");
        }
      } else if (sg.coop === "stridave") {
        if (!playCue("switch")) speech.speak("Střídání.");
      }
    }
  };

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => tickRef.current(), 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    activeSegRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [index]);

  // Drž obrazovku rozsvícenou během tréninku (mobil) – Wake Lock API.
  useEffect(() => {
    if (!running || typeof navigator === "undefined") return;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
    if (!nav.wakeLock) return;
    let lock: { release: () => Promise<void> } | null = null;
    let active = true;
    const acquire = () => {
      nav.wakeLock!.request("screen").then((l) => { if (active) lock = l; else l.release().catch(() => {}); }).catch(() => {});
    };
    acquire();
    const onVis = () => { if (document.visibilityState === "visible") acquire(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      active = false;
      document.removeEventListener("visibilitychange", onVis);
      lock?.release().catch(() => {});
    };
  }, [running]);

  const start = () => {
    const segs = preset
      ? preset.segments
      : generateWorkout(BOX_DRILLS, {
          participants,
          durationMin,
          restSec,
          phases,
          names: names.slice(0, participants),
        });
    if (segs.length <= 1) return;
    completedRef.current = false;
    audio.unlock();
    segsRef.current = segs;
    setSegments(segs);
    setRunning(true);
    goTo(0);
  };

  const togglePlay = () => {
    if (!started) return;
    if (running) {
      setRunning(false);
      speech.pause();
      instrRef.current?.pause();
      cueRef.current?.pause();
    } else {
      audio.unlock();
      setRunning(true);
      speech.resume();
    }
  };

  const reset = () => {
    preRef.current = { work: null, leadSec: 0, announced: false };
    workPreannouncedRef.current = false;
    setRunning(false);
    setIndex(-1);
    setSegments([]);
    speech.cancel();
    instrRef.current?.pause();
    cueRef.current?.pause();
    preAudioRef.current?.pause();
  };

  const anyPhase = CATEGORY_ORDER.some((k) => phases[k]);

  // Sdílená karta „Hlas a zvuk" pro obě setup obrazovky.
  const voicePanel = (intro: ReactNode) => (
    <section className={card}>
      <h2 className="text-lg font-semibold text-zinc-900">Hlas a zvuk</h2>
      {speech.supported ? (
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">Hlas (čeština)</label>
            <select className={`${inputCls} mt-1`} value={speech.voiceURI ?? ""} onChange={(e) => speech.setVoiceURI(e.target.value)}>
              {speech.voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-zinc-500">
              <span>Rychlost hlasu</span>
              <span className="text-zinc-700">{speech.rate.toFixed(2)}×</span>
            </div>
            <input className="mt-1 w-full accent-zinc-900" type="range" min={0.6} max={1.3} step={0.05} value={speech.rate} onChange={(e) => speech.setRate(Number(e.target.value))} />
          </div>
          <button
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
            onClick={() => speech.speak("Hlasový trenér je připraven.")}
          >
            🔊 Vyzkoušet hlas
          </button>
        </div>
      ) : (
        <p className="mt-3 text-sm text-zinc-500">Tvůj prohlížeč nepodporuje hlasovou syntézu.</p>
      )}
      <p className="mt-5 text-sm text-zinc-500">{intro}</p>
    </section>
  );

  // ---------------- SETUP (autorovaný trénink) ----------------
  if (!started && preset) {
    const pt = workoutTotals(preset.segments);
    return (
      <Shell
        right={
          <Link href="/treninky" className="text-sm text-zinc-500 transition hover:text-zinc-900">
            ← Moje tréninky
          </Link>
        }
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <section className={card}>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{preset.title}</h1>
            <p className="mt-1 text-sm text-zinc-500">
              {preset.sportSlug ? `${preset.sportSlug} · ` : ""}
              {pt.rounds} kol · práce {formatTime(pt.workSec)}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <Stat label="Celkem" value={formatTime(pt.totalSec)} />
              <Stat label="Práce" value={formatTime(pt.workSec)} />
              <Stat label="Kol" value={String(pt.rounds)} />
            </div>
            <button
              className="mt-6 w-full rounded-xl bg-zinc-900 px-5 py-3 text-base font-medium text-white transition hover:bg-zinc-800 disabled:opacity-40"
              onClick={start}
              disabled={pt.rounds === 0}
            >
              ▶ Spustit trénink
            </button>
          </section>
          {voicePanel(
            <>
              Ahoj <b>{userName}</b>. Tohle je tvůj vlastní trénink — systém tě hlasem (nebo tvými MP3) provede koly i
              pauzami. Po dokončení se uloží do historie.
            </>,
          )}
        </div>
      </Shell>
    );
  }

  // ---------------- SETUP (procedurální generátor) ----------------
  if (!started) {
    return (
      <Shell
        right={
          <Link href="/dashboard" className="text-sm text-zinc-500 transition hover:text-zinc-900">
            ← Přehled
          </Link>
        }
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <section className={card}>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Sestavení tréninku</h1>

            <div className="mt-5 space-y-5">
              <Slider label="Počet cvičících" value={`${participants}`} min={1} max={6} step={1} v={participants} onChange={setParticipants} />
              <Slider label="Délka tréninku" value={`${durationMin} min`} min={10} max={90} step={5} v={durationMin} onChange={setDurationMin} />
              <Slider label="Pauza mezi koly" value={`${restSec} s`} min={10} max={45} step={5} v={restSec} onChange={setRestSec} />

              <div>
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Fáze tréninku</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CATEGORY_ORDER.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setPhases((p) => ({ ...p, [k]: !p[k] }))}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                        phases[k] ? "bg-zinc-900 text-white" : "border border-zinc-300 text-zinc-600 hover:bg-zinc-100"
                      }`}
                    >
                      {CATEGORY_LABELS[k]} ({counts[k]})
                    </button>
                  ))}
                </div>
              </div>

              {participants > 1 && (
                <div>
                  <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Jména cvičících (volitelné)</span>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {Array.from({ length: participants }).map((_, i) => (
                      <input
                        key={i}
                        className={inputCls}
                        placeholder={`Cvičící ${i + 1}`}
                        value={names[i]}
                        onChange={(e) =>
                          setNames((n) => {
                            const c = [...n];
                            c[i] = e.target.value;
                            return c;
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              <button
                className="w-full rounded-xl bg-zinc-900 px-5 py-3 text-base font-medium text-white transition hover:bg-zinc-800 disabled:opacity-40"
                onClick={start}
                disabled={!anyPhase}
              >
                ▶ Sestavit a spustit
              </button>
            </div>
          </section>

          {voicePanel(
            <>
              Ahoj <b>{userName}</b>. Vyber parametry a spusť trénink — systém tě hlasem provede koly, pauzami i rolemi.
              Zatím obsahuje disciplínu <b>Box</b> ({CATEGORY_ORDER.reduce((a, k) => a + counts[k], 0)} cviků).
            </>,
          )}
        </div>
      </Shell>
    );
  }

  // ---------------- RUNNING ----------------
  const pct = seg ? Math.max(0, (timeLeft / seg.duration) * 100) : 0;
  const st = seg ? STATE[seg.kind] : STATE.prepare;
  return (
    <Shell
      right={
        <button className="text-sm text-zinc-500 transition hover:text-zinc-900" onClick={reset}>
          ✕ Ukončit
        </button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Časovač */}
        <section className={`min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 text-center shadow-sm ring-2 sm:p-6 ${st.ring} transition`}>
          <div className={`inline-flex max-w-full rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${st.tag}`}>
            {seg && phaseLabel(seg)}
            {seg?.kind === "work" && seg.roundNum ? ` · kolo ${seg.roundNum}/${seg.totalRoundsInPhase}` : ""}
          </div>
          <div className={`mt-2 font-bold tabular-nums tracking-tight ${st.text} text-[clamp(3rem,15vw,6.5rem)] leading-none`}>
            {formatTime(timeLeft)}
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100">
            <div className={`h-full ${st.bar} transition-[width] duration-1000 ease-linear`} style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-3 break-words text-lg font-semibold text-zinc-900 sm:mt-4 sm:text-xl">{seg?.name}</div>
          {seg?.voiceText && seg.kind === "work" && <div className="mt-1 break-words text-sm text-zinc-500">{seg.voiceText}</div>}
          {seg?.roles && (
            <div className="mt-3 inline-block rounded-lg border border-dashed border-amber-400 px-3 py-1.5 text-sm text-amber-700">
              {seg.roles}
            </div>
          )}
          {seg?.nextName && (
            <div className="mt-3 text-sm text-zinc-400">
              Následuje: <b className="text-zinc-600">{seg.nextName}</b>
            </div>
          )}

          <div className="mt-4 flex items-center justify-center gap-2 sm:mt-6 sm:gap-3">
            <CtrlButton title="Zopakovat pokyn" onClick={() => seg && readInstruction(seg)} className="h-12 w-12 border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 sm:h-14 sm:w-14">
              ↻
            </CtrlButton>
            <CtrlButton title={running ? "Pauza" : "Spustit"} onClick={togglePlay} className="h-16 w-16 bg-zinc-900 text-xl text-white hover:bg-zinc-800 sm:h-20 sm:w-20 sm:text-2xl">
              {running ? "❚❚" : "▶"}
            </CtrlButton>
            <CtrlButton title="Přeskočit" onClick={() => goTo(index + 1)} className="h-12 w-12 border border-zinc-300 text-zinc-700 hover:bg-zinc-100 sm:h-14 sm:w-14">
              ⏭
            </CtrlButton>
            <CtrlButton title="Ukončit" onClick={reset} className="h-12 w-12 border border-red-300 bg-red-50 text-red-600 hover:bg-red-100 sm:h-14 sm:w-14">
              ⏹
            </CtrlButton>
          </div>

          {speech.supported && (
            <button className="mt-4 text-sm text-zinc-400 transition hover:text-zinc-700" onClick={() => speech.setMuted(!speech.muted)}>
              {speech.muted ? "🔇 Hlas ztišený (zapnout)" : "🔊 Hlas zapnutý (ztišit)"}
            </button>
          )}
        </section>

        {/* Plán */}
        <section className={`${card} min-w-0`}>
          <h2 className="text-lg font-semibold text-zinc-900">Plán</h2>
          <div className="mt-2 flex gap-4 text-sm text-zinc-500">
            <span>Celkem <b className="text-zinc-800">{formatTime(totals.totalSec)}</b></span>
            <span>Práce <b className="text-zinc-800">{formatTime(totals.workSec)}</b></span>
            <span>Kol <b className="text-zinc-800">{totals.rounds}</b></span>
          </div>
          <div className="mt-3 max-h-[60vh] space-y-1.5 overflow-y-auto pr-1">
            {segments.map((sg, i) => (
              <div
                key={i}
                ref={i === index ? activeSegRef : undefined}
                className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm transition ${
                  i === index
                    ? "border-zinc-900 bg-zinc-900/[0.04] font-medium text-zinc-900"
                    : i < index
                      ? "border-zinc-100 text-zinc-400"
                      : sg.kind !== "work"
                        ? "border-zinc-100 bg-zinc-50 text-zinc-500"
                        : "border-zinc-200 text-zinc-700"
                }`}
              >
                <span className="min-w-0 truncate">
                  {sg.kind === "work" ? `${phaseLabel(sg)}: ${sg.spokenName}` : phaseLabel(sg)}
                </span>
                <small className="shrink-0 tabular-nums text-zinc-400">{formatTime(sg.duration)}</small>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</div>
      <div className="mt-0.5 text-lg font-semibold tabular-nums text-zinc-900">{value}</div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  v,
  onChange,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  v: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-zinc-500">
        <span>{label}</span>
        <span className="text-zinc-700">{value}</span>
      </div>
      <input
        className="mt-1 w-full accent-zinc-900"
        type="range"
        min={min}
        max={max}
        step={step}
        value={v}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function CtrlButton({
  children,
  title,
  onClick,
  className,
}: {
  children: ReactNode;
  title: string;
  onClick: () => void;
  className: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold transition ${className}`}
    >
      {children}
    </button>
  );
}
