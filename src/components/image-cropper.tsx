"use client";

import { useCallback, useRef, useState, type PointerEvent } from "react";

// Interaktivní ořez obrázku: táhnutím posun, posuvníkem zoom. Vykreslí čtvercový
// výřez (kruh/zaoblený) a po potvrzení vrátí JPEG data URL přes onConfirm.
// Pozn.: matematika ořezu používá `viewport` jako CSS px → musí odpovídat
// skutečné velikosti okénka (drží se to stejné konstanty).
type Frame = { scale: number; x: number; y: number };

export function ImageCropper({
  src,
  shape = "square",
  viewport = 200,
  out = 256,
  pending,
  onConfirm,
  onCancel,
}: {
  src: string;
  shape?: "circle" | "square";
  viewport?: number;
  out?: number;
  pending?: boolean;
  onConfirm: (dataUrl: string) => void;
  onCancel: () => void;
}) {
  const V = viewport;
  const imgRef = useRef<HTMLImageElement | null>(null);
  const natural = useRef({ w: 0, h: 0 });
  const baseScale = useRef(1);
  const [frame, setFrame] = useState<Frame>({ scale: 1, x: 0, y: 0 });
  const dragRef = useRef<{ px: number; py: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dispW = natural.current.w * baseScale.current * frame.scale;
  const dispH = natural.current.h * baseScale.current * frame.scale;

  const clamp = useCallback(
    (x: number, y: number, dw: number, dh: number) => ({
      x: Math.min(0, Math.max(V - dw, x)),
      y: Math.min(0, Math.max(V - dh, y)),
    }),
    [V],
  );

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
    const x = c - ((c - frame.x) * newDw) / oldDw;
    const y = c - ((c - frame.y) * newDh) / oldDh;
    setFrame({ scale: next, ...clamp(x, y, newDw, newDh) });
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
    canvas.width = out;
    canvas.height = out;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const ratio = out / V;
    ctx.drawImage(img, frame.x * ratio, frame.y * ratio, dispW * ratio, dispH * ratio);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    if (dataUrl.length > 400_000) {
      setError("Obrázek se nepodařilo zmenšit dostatečně.");
      return;
    }
    onConfirm(dataUrl);
  }

  return (
    <div className={`flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6 ${pending ? "pointer-events-none opacity-60" : ""}`}>
      <div
        className={`relative shrink-0 touch-none overflow-hidden ring-2 ring-zinc-300 ${shape === "circle" ? "rounded-full" : "rounded-xl"}`}
        style={{ width: V, height: V, cursor: "grab" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- lokální data URL */}
        <img
          ref={imgRef}
          src={src}
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
          <button type="button" onClick={save} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800">
            Uložit
          </button>
          <button type="button" onClick={onCancel} className="text-sm text-zinc-500 transition hover:text-zinc-800">
            Zrušit
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
