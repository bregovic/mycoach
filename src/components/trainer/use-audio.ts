"use client";

import { useCallback, useRef } from "react";

type Ctx = AudioContext & { webkitAudioContext?: never };

/** Gong a tikání přes Web Audio API – bez závislostí, bez zvukových souborů. */
export function useAudio() {
  const ctxRef = useRef<Ctx | null>(null);

  const getCtx = useCallback((): Ctx | null => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctxRef.current = new AC() as Ctx;
    }
    if (ctxRef.current.state === "suspended") void ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  /** Odemkne audio kontext (volat z user gesta – tlačítko Start). */
  const unlock = useCallback(() => {
    getCtx();
  }, [getCtx]);

  const strike = useCallback((ctx: Ctx, t: number) => {
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
    gain.connect(ctx.destination);
    const o1 = ctx.createOscillator();
    o1.type = "sine";
    o1.frequency.value = 880;
    const o2 = ctx.createOscillator();
    o2.type = "triangle";
    o2.frequency.value = 1320;
    o1.connect(gain);
    o2.connect(gain);
    o1.start(t);
    o2.start(t);
    o1.stop(t + 1.2);
    o2.stop(t + 1.2);
  }, []);

  const playBell = useCallback(
    (triple = false) => {
      const ctx = getCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      if (triple) {
        strike(ctx, now);
        strike(ctx, now + 0.3);
        strike(ctx, now + 0.6);
      } else {
        strike(ctx, now);
        strike(ctx, now + 0.35);
      }
    },
    [getCtx, strike],
  );

  const playTick = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    gain.connect(ctx.destination);
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = 600;
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.08);
  }, [getCtx]);

  return { playBell, playTick, unlock };
}
