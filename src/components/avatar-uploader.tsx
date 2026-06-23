"use client";

import { useCallback, useRef, useState, type DragEvent, type PointerEvent } from "react";
import { useRouter } from "next/navigation";
import { removeAvatarAction, updateAvatarAction } from "@/lib/actions/avatar";
import { Avatar } from "./avatar";

const OUT = 256; // výsledná strana čtverce v px
const V = 200; // velikost náhledového okénka (CSS px); menší kvůli úzkým telefonům

type Frame = { scale: number; x: number; y: number };

export function AvatarUploader({ src, name }: { src: string | null; name: string | null }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editSrc, setEditSrc] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const natural = useRef({ w: 0, h: 0 });
  const baseScale = useRef(1);
  const [frame, setFrame] = useState<Frame>({ scale: 1, x: 0, y: 0 });
  const dragRef = useRef<{ px: number; py: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const dispW = natural.current.w * baseScale.current * frame.scale;
  const dispH = natural.current.h * baseScale.current * frame.scale;

  const clamp = useCallback((x: number, y: number, dw: number, dh: number) => {
    return {
      x: Math.min(0, Math.max(V - dw, x)),
      y: Math.min(0, Math.max(V - dh, y)),
    };
  }, []);

  function loadFile(file: File | null | undefined) {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Vyber prosím obrázek.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setEditSrc(String(reader.result));
    reader.onerror = () => setError("Obrázek se nepodařilo načíst.");
    reader.readAsDataURL(file);
  }

  // Po načtení obrázku do <img> spočítej base scale a vycentruj.
  function onImgLoad() {
    const img = imgRef.current;
    if (!img) return;
    natural.current = { w: img.naturalWidth, h: img.naturalHeight };
    baseScale.current = Math.max(V / img.naturalWidth, V / img.naturalHeight);
    const dw = img.naturalWidth * baseScale.current;
    const dh = img.naturalHeight * baseScale.current;
    setFrame({ scale: 1, x: (V - dw) / 2, y: (V - dh) / 2 });
  }

  function onZoom(next: number) {
    const oldDw = dispW;
    const oldDh = dispH;
    const newDw = natural.current.w * baseScale.current * next;
    const newDh = natural.current.h * baseScale.current * next;
    const c = V / 2;
    // přiblížení/oddálení kolem středu okénka
    const x = c - ((c - frame.x) * newDw) / oldDw;
    const y = c - ((c - frame.y) * newDh) / oldDh;
    const cl = clamp(x, y, newDw, newDh);
    setFrame({ scale: next, ...cl });
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { px: e.clientX, py: e.clientY };
  }
  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const d = dragRef.current;
    if (!d) return;
    const nx = frame.x + (e.clientX - d.px);
    const ny = frame.y + (e.clientY - d.py);
    dragRef.current = { px: e.clientX, py: e.clientY };
    setFrame((f) => ({ ...f, ...clamp(nx, ny, dispW, dispH) }));
  }
  function onPointerUp() {
    dragRef.current = null;
  }

  function save() {
    const img = imgRef.current;
    if (!img) return;
    const canvas = document.createElement("canvas");
    canvas.width = OUT;
    canvas.height = OUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const ratio = OUT / V;
    ctx.drawImage(img, frame.x * ratio, frame.y * ratio, dispW * ratio, dispH * ratio);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    if (dataUrl.length > 300_000) {
      setError("Obrázek se nepodařilo zmenšit dostatečně.");
      return;
    }
    setPending(true);
    updateAvatarAction(dataUrl)
      .then(() => {
        setEditSrc(null);
        router.refresh();
      })
      .finally(() => setPending(false));
  }

  function remove() {
    setPending(true);
    removeAvatarAction()
      .then(() => router.refresh())
      .finally(() => setPending(false));
  }

  // Editor ořezu -----------------------------------------------------------
  if (editSrc) {
    return (
      <div className={pending ? "pointer-events-none opacity-60" : ""}>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
          <div
            className="relative shrink-0 touch-none overflow-hidden rounded-full ring-2 ring-zinc-300"
            style={{ width: V, height: V, cursor: "grab" }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- lokální data URL */}
            <img
              ref={imgRef}
              src={editSrc}
              alt=""
              onLoad={onImgLoad}
              draggable={false}
              style={{
                position: "absolute",
                left: frame.x,
                top: frame.y,
                width: dispW || undefined,
                height: dispH || undefined,
                maxWidth: "none",
                userSelect: "none",
              }}
            />
            <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/40" />
          </div>

          <div className="w-full max-w-xs">
            <p className="text-sm font-medium text-zinc-700">Uprav výřez</p>
            <p className="mt-0.5 text-xs text-zinc-400">Táhni pro posun, posuvníkem přibliž.</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-zinc-400">−</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={frame.scale}
                onChange={(e) => onZoom(Number(e.target.value))}
                className="w-full accent-zinc-900"
              />
              <span className="text-xs text-zinc-400">+</span>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={save}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                Uložit fotku
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditSrc(null);
                  setError(null);
                }}
                className="text-sm text-zinc-500 transition hover:text-zinc-800"
              >
                Zrušit
              </button>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  // Klidový stav -----------------------------------------------------------
  return (
    <div className={`flex items-center gap-5 ${pending ? "opacity-60" : ""}`}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e: DragEvent<HTMLButtonElement>) => {
          e.preventDefault();
          setDrag(false);
          loadFile(e.dataTransfer.files?.[0]);
        }}
        className={`group relative h-24 w-24 shrink-0 overflow-hidden rounded-full ring-2 transition ${
          drag ? "ring-zinc-900" : "ring-zinc-200 hover:ring-zinc-400"
        }`}
        aria-label="Nahrát profilovou fotku"
      >
        <Avatar src={src} name={name} size={96} />
        <span className="absolute inset-0 flex items-center justify-center bg-zinc-900/0 text-xs font-medium text-transparent transition group-hover:bg-zinc-900/55 group-hover:text-white">
          {src ? "Změnit" : "Nahrát"}
        </span>
      </button>

      <div className="min-w-0">
        <p className="text-sm text-zinc-600">Přetáhni fotku na kolečko, nebo klikni a vyber soubor.</p>
        <p className="mt-0.5 text-xs text-zinc-400">JPG, PNG nebo WebP — pak si upravíš výřez.</p>
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
          >
            Vybrat fotku
          </button>
          {src && (
            <button
              type="button"
              onClick={remove}
              className="text-sm text-red-600 transition hover:text-red-700"
            >
              Odebrat
            </button>
          )}
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          loadFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
