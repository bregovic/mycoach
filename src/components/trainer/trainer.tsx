"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import s from "./trainer.module.css";
import { BOX_DRILLS, drillCount } from "@/lib/trainer/drills";
import { formatTime, generateWorkout, phaseLabel, workoutTotals } from "@/lib/trainer/generate";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/trainer/types";
import type { CategoryKey, Segment } from "@/lib/trainer/types";
import { logCompletedWorkout } from "@/lib/actions/trainings";
import { useAudio } from "./use-audio";
import { useSpeech } from "./use-speech";

const stateClass = (k: Segment["kind"]) =>
  k === "work" ? s.work : k === "rest" ? s.rest : k === "prepare" ? s.prepare : s.finish;

/** Předpřipravený (autorovaný) trénink k přehrání místo procedurálního generování. */
export interface TrainerPreset {
  title: string;
  sportSlug?: string | null;
  segments: Segment[];
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

  // Přehraje náhodný uživatelský zvukový pokyn daného typu. Vrací, zda něco hrálo.
  const playCue = useCallback((type: string): boolean => {
    const arr = cuesRef.current[type];
    if (!arr || arr.length === 0) return false;
    const url = arr[Math.floor(Math.random() * arr.length)];
    try {
      if (!cueRef.current) cueRef.current = new Audio();
      cueRef.current.src = url;
      void cueRef.current.play().catch(() => {});
    } catch {
      /* ignore */
    }
    return true;
  }, []);

  const announce = useCallback(
    (sg: Segment) => {
      // Technický cue podle typu úseku (náhradou za gong, pokud je nahraný).
      let cuePlayed = false;
      if (sg.kind === "prepare") cuePlayed = playCue("start");
      else if (sg.kind === "work") cuePlayed = playCue("round_start");
      else if (sg.kind === "rest") cuePlayed = playCue("round_end") || playCue("rest");
      else if (sg.kind === "finish") cuePlayed = playCue("finish");
      if (!cuePlayed) audio.playBell(sg.kind === "prepare" || sg.kind === "finish");
      // Nahraná MP3 instrukce má přednost před čtením (TTS).
      if (sg.audioUrl) {
        if (!speech.muted) {
          try {
            if (!instrRef.current) instrRef.current = new Audio();
            instrRef.current.pause();
            instrRef.current.src = sg.audioUrl;
            void instrRef.current.play().catch(() => {});
          } catch {
            /* ignore */
          }
        }
        return;
      }
      const text =
        sg.kind === "work"
          ? `Kolo ${sg.roundNum}. ${sg.spokenName}. ${sg.voiceText ?? ""}`
          : sg.voiceText ?? "";
      speech.speak(text);
    },
    [audio, speech, playCue],
  );

  const goTo = useCallback(
    (i: number) => {
      const segs = segsRef.current;
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
      setIndex(i);
      setTimeLeft(segs[i].duration);
      announce(segs[i]);
    },
    [announce, speech],
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
    if (next <= 5) audio.playTick();
    if (next === 5) playCue("countdown");
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
    setIndex(0);
    setTimeLeft(segs[0].duration);
    setRunning(true);
    announce(segs[0]);
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
    setRunning(false);
    setIndex(-1);
    setSegments([]);
    speech.cancel();
    instrRef.current?.pause();
    cueRef.current?.pause();
  };

  const anyPhase = CATEGORY_ORDER.some((k) => phases[k]);

  // ---------------- SETUP (autorovaný trénink) ----------------
  if (!started && preset) {
    const pt = workoutTotals(preset.segments);
    return (
      <div className={s.wrap}>
        <div className={s.inner}>
          <header className={s.header}>
            <span className={s.logo}>
              My<b>Coach</b> · Trénink
            </span>
            <Link href="/treninky" className={s.back}>
              ← Moje tréninky
            </Link>
          </header>

          <div className={s.grid}>
            <section className={s.card}>
              <h2 className={s.h2}>{preset.title}</h2>
              <p className={s.sub}>
                {preset.sportSlug ? `${preset.sportSlug} · ` : ""}
                {pt.rounds} kol · práce {formatTime(pt.workSec)}
              </p>
              <div className={s.tlTotals} style={{ marginTop: "1rem" }}>
                <span>
                  Celkem <b>{formatTime(pt.totalSec)}</b>
                </span>
                <span>
                  Práce <b>{formatTime(pt.workSec)}</b>
                </span>
                <span>
                  Kol <b>{pt.rounds}</b>
                </span>
              </div>
              <button
                className={`${s.btn} ${s.btnPrimary}`}
                style={{ marginTop: "1.25rem" }}
                onClick={start}
                disabled={pt.rounds === 0}
              >
                ▶ Spustit trénink
              </button>
            </section>

            <section className={s.card}>
              <h2 className={s.h2}>Hlas a zvuk</h2>
              {speech.supported ? (
                <>
                  <div className={s.field}>
                    <div className={s.label}>
                      <span>Hlas (čeština)</span>
                    </div>
                    <select
                      className={s.select}
                      value={speech.voiceURI ?? ""}
                      onChange={(e) => speech.setVoiceURI(e.target.value)}
                    >
                      {speech.voices.map((v) => (
                        <option key={v.voiceURI} value={v.voiceURI}>
                          {v.name} ({v.lang})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={s.field}>
                    <div className={s.label}>
                      <span>Rychlost hlasu</span>
                      <b>{speech.rate.toFixed(2)}×</b>
                    </div>
                    <input
                      className={s.range}
                      type="range"
                      min={0.6}
                      max={1.3}
                      step={0.05}
                      value={speech.rate}
                      onChange={(e) => speech.setRate(Number(e.target.value))}
                    />
                  </div>
                  <button
                    className={s.btn}
                    onClick={() => speech.speak("Hlasový trenér je připraven.")}
                  >
                    🔊 Vyzkoušet hlas
                  </button>
                </>
              ) : (
                <p className={s.sub}>Tvůj prohlížeč nepodporuje hlasovou syntézu.</p>
              )}
              <p className={s.next} style={{ marginTop: "1.25rem" }}>
                Ahoj <b>{userName}</b>. Tohle je tvůj vlastní trénink — systém tě hlasem provede koly
                i pauzami. Po dokončení se uloží do historie.
              </p>
            </section>
          </div>
        </div>
      </div>
    );
  }

  // ---------------- SETUP (procedurální generátor) ----------------
  if (!started) {
    return (
      <div className={s.wrap}>
        <div className={s.inner}>
          <header className={s.header}>
            <span className={s.logo}>
              My<b>Coach</b> · Trénink
            </span>
            <Link href="/dashboard" className={s.back}>
              ← Dashboard
            </Link>
          </header>

          <div className={s.grid}>
            <section className={s.card}>
              <h2 className={s.h2}>Sestavení tréninku</h2>

              <div className={s.field}>
                <div className={s.label}>
                  <span>Počet cvičících</span>
                  <b>{participants}</b>
                </div>
                <input
                  className={s.range}
                  type="range"
                  min={1}
                  max={6}
                  value={participants}
                  onChange={(e) => setParticipants(Number(e.target.value))}
                />
              </div>

              <div className={s.field}>
                <div className={s.label}>
                  <span>Délka tréninku</span>
                  <b>{durationMin} min</b>
                </div>
                <input
                  className={s.range}
                  type="range"
                  min={10}
                  max={90}
                  step={5}
                  value={durationMin}
                  onChange={(e) => setDurationMin(Number(e.target.value))}
                />
              </div>

              <div className={s.field}>
                <div className={s.label}>
                  <span>Pauza mezi koly</span>
                  <b>{restSec} s</b>
                </div>
                <input
                  className={s.range}
                  type="range"
                  min={10}
                  max={45}
                  step={5}
                  value={restSec}
                  onChange={(e) => setRestSec(Number(e.target.value))}
                />
              </div>

              <div className={s.field}>
                <div className={s.label}>
                  <span>Fáze tréninku</span>
                </div>
                <div className={s.chips}>
                  {CATEGORY_ORDER.map((k) => (
                    <button
                      key={k}
                      type="button"
                      className={`${s.chip} ${phases[k] ? s.chipOn : ""}`}
                      onClick={() => setPhases((p) => ({ ...p, [k]: !p[k] }))}
                    >
                      {CATEGORY_LABELS[k]} ({counts[k]})
                    </button>
                  ))}
                </div>
              </div>

              {participants > 1 && (
                <div className={s.field}>
                  <div className={s.label}>
                    <span>Jména cvičících (volitelné)</span>
                  </div>
                  <div className={s.names}>
                    {Array.from({ length: participants }).map((_, i) => (
                      <input
                        key={i}
                        className={s.input}
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

              <button className={`${s.btn} ${s.btnPrimary}`} onClick={start} disabled={!anyPhase}>
                ▶ Sestavit a spustit
              </button>
            </section>

            <section className={s.card}>
              <h2 className={s.h2}>Hlas a zvuk</h2>
              {speech.supported ? (
                <>
                  <div className={s.field}>
                    <div className={s.label}>
                      <span>Hlas (čeština)</span>
                    </div>
                    <select
                      className={s.select}
                      value={speech.voiceURI ?? ""}
                      onChange={(e) => speech.setVoiceURI(e.target.value)}
                    >
                      {speech.voices.map((v) => (
                        <option key={v.voiceURI} value={v.voiceURI}>
                          {v.name} ({v.lang})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={s.field}>
                    <div className={s.label}>
                      <span>Rychlost hlasu</span>
                      <b>{speech.rate.toFixed(2)}×</b>
                    </div>
                    <input
                      className={s.range}
                      type="range"
                      min={0.6}
                      max={1.3}
                      step={0.05}
                      value={speech.rate}
                      onChange={(e) => speech.setRate(Number(e.target.value))}
                    />
                  </div>
                  <button
                    className={s.btn}
                    onClick={() => speech.speak("Hlasový trenér je připraven.")}
                  >
                    🔊 Vyzkoušet hlas
                  </button>
                </>
              ) : (
                <p className={s.sub}>Tvůj prohlížeč nepodporuje hlasovou syntézu.</p>
              )}
              <p className={s.next} style={{ marginTop: "1.25rem" }}>
                Ahoj <b>{userName}</b>. Vyber parametry a spusť trénink — systém tě hlasem provede
                koly, pauzami i rolemi. Zatím obsahuje disciplínu <b>Box</b> ({" "}
                {CATEGORY_ORDER.reduce((a, k) => a + counts[k], 0)} cviků).
              </p>
            </section>
          </div>
        </div>
      </div>
    );
  }

  // ---------------- RUNNING ----------------
  const pct = seg ? Math.max(0, (timeLeft / seg.duration) * 100) : 0;
  return (
    <div className={s.wrap}>
      <div className={s.inner}>
        <header className={s.header}>
          <span className={s.logo}>
            My<b>Coach</b> · Trénink
          </span>
          <button className={s.back} onClick={reset}>
            ✕ Ukončit
          </button>
        </header>

        <div className={`${s.grid} ${s.gridRun}`}>
          <section className={`${s.card} ${s.timer} ${seg ? stateClass(seg.kind) : ""}`}>
            <div className={s.phaseTag}>
              {seg && phaseLabel(seg)}
              {seg?.kind === "work" && seg.roundNum
                ? ` · kolo ${seg.roundNum}/${seg.totalRoundsInPhase}`
                : ""}
            </div>
            <div className={s.time}>{formatTime(timeLeft)}</div>
            <div className={s.bar}>
              <div className={s.barFill} style={{ width: `${pct}%` }} />
            </div>
            <div className={s.name}>{seg?.name}</div>
            {seg?.voiceText && seg.kind === "work" && <div className={s.sub}>{seg.voiceText}</div>}
            {seg?.roles && <div className={s.roles}>{seg.roles}</div>}
            {seg?.nextName && (
              <div className={s.next}>
                Následuje: <b>{seg.nextName}</b>
              </div>
            )}

            <div className={s.controls}>
              <button
                className={`${s.btn} ${s.round} ${s.warn}`}
                title="Zopakovat pokyn"
                onClick={() => seg && announce(seg)}
              >
                ↻
              </button>
              <button
                className={`${s.btn} ${s.round} ${s.roundBig} ${s.go}`}
                title={running ? "Pauza" : "Spustit"}
                onClick={togglePlay}
              >
                {running ? "❚❚" : "▶"}
              </button>
              <button
                className={`${s.btn} ${s.round}`}
                title="Přeskočit"
                onClick={() => goTo(index + 1)}
              >
                ⏭
              </button>
              <button
                className={`${s.btn} ${s.round} ${s.danger}`}
                title="Ukončit"
                onClick={reset}
              >
                ⏹
              </button>
            </div>
            {speech.supported && (
              <button
                className={s.next}
                style={{ marginTop: "0.9rem", background: "none", border: "none", cursor: "pointer" }}
                onClick={() => speech.setMuted(!speech.muted)}
              >
                {speech.muted ? "🔇 Hlas ztišený (zapnout)" : "🔊 Hlas zapnutý (ztišit)"}
              </button>
            )}
          </section>

          <section className={s.card}>
            <h2 className={s.h2}>Plán</h2>
            <div className={s.tlTotals}>
              <span>
                Celkem <b>{formatTime(totals.totalSec)}</b>
              </span>
              <span>
                Práce <b>{formatTime(totals.workSec)}</b>
              </span>
              <span>
                Kol <b>{totals.rounds}</b>
              </span>
            </div>
            <div className={s.tl}>
              {segments.map((sg, i) => (
                <div
                  key={i}
                  ref={i === index ? activeSegRef : undefined}
                  className={`${s.seg} ${i < index ? s.segDone : ""} ${
                    i === index ? s.segActive : ""
                  } ${sg.kind !== "work" ? s.segRest : ""}`}
                >
                  <span>
                    {sg.kind === "work" ? `${phaseLabel(sg)}: ${sg.spokenName}` : phaseLabel(sg)}
                  </span>
                  <small>{formatTime(sg.duration)}</small>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
