"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface SpeechState {
  supported: boolean;
  voices: SpeechSynthesisVoice[];
  voiceURI: string | null;
  setVoiceURI: (uri: string) => void;
  muted: boolean;
  setMuted: (m: boolean) => void;
  rate: number;
  setRate: (r: number) => void;
  speak: (text: string) => void;
  cancel: () => void;
  pause: () => void;
  resume: () => void;
}

/** Preferuj online/natural/neural české hlasy (lépe znějí). */
function rankVoice(v: SpeechSynthesisVoice): number {
  const n = `${v.name} ${v.voiceURI}`.toLowerCase();
  let score = 0;
  if (/natural|neural|online|premium/.test(n)) score += 3;
  if (!v.localService) score += 1;
  return score;
}

export function useSpeech(): SpeechState {
  const [supported, setSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(0.95);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const uriRef = useRef<string | null>(null);
  const mutedRef = useRef(false);
  const rateRef = useRef(0.95);

  useEffect(() => {
    uriRef.current = voiceURI;
  }, [voiceURI]);
  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);
  useEffect(() => {
    rateRef.current = rate;
  }, [rate]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setSupported(true);
    const load = () => {
      const all = window.speechSynthesis.getVoices();
      const cs = all.filter((v) => v.lang.toLowerCase().startsWith("cs"));
      const list = (cs.length ? cs : all).sort((a, b) => rankVoice(b) - rankVoice(a));
      voicesRef.current = list;
      setVoices(list);
      setVoiceURI((cur) => cur ?? list[0]?.voiceURI ?? null);
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (mutedRef.current || !text.trim()) return;
    const clean = text.replace(/&/g, " a ").replace(/\s+/g, " ").trim();
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clean);
    const v = voicesRef.current.find((x) => x.voiceURI === uriRef.current);
    if (v) {
      u.voice = v;
      u.lang = v.lang;
    } else {
      u.lang = "cs-CZ";
    }
    u.rate = rateRef.current;
    u.pitch = 1;
    u.volume = 1;
    window.speechSynthesis.speak(u);
  }, []);

  const cancel = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);
  const pause = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.pause();
  }, []);
  const resume = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.resume();
  }, []);

  return {
    supported,
    voices,
    voiceURI,
    setVoiceURI,
    muted,
    setMuted,
    rate,
    setRate,
    speak,
    cancel,
    pause,
    resume,
  };
}
