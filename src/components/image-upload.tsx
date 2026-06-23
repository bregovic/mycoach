"use client";

import { useRef, useState, type DragEvent } from "react";

// Jednoduchý upload obrázku (logo tréninku): zmenší na max stranu MAX px se
// zachováním poměru, vrátí JPEG data URL přes onPick. Bez ořezu (na to je avatar).
const MAX = 512;

async function resize(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  return canvas.toDataURL("image/jpeg", 0.85);
}

export function ImageUpload({
  url,
  onPick,
  onClear,
  disabled,
}: {
  url: string | null;
  onPick: (dataUrl: string) => void;
  onClear: () => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle(file: File | null | undefined) {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Vyber obrázek.");
      return;
    }
    try {
      const dataUrl = await resize(file);
      if (dataUrl.length > 400_000) {
        setError("Obrázek je moc velký.");
        return;
      }
      onPick(dataUrl);
    } catch {
      setError("Obrázek se nepodařilo načíst.");
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e: DragEvent<HTMLButtonElement>) => {
          e.preventDefault();
          setDrag(false);
          handle(e.dataTransfer.files?.[0]);
        }}
        className={`group relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition ${
          drag ? "border-zinc-900 bg-zinc-50" : "border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50"
        }`}
        aria-label="Nahrát logo tréninku"
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- data URL
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="px-2 text-center text-xs text-zinc-400">Logo / obrázek</span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-zinc-900/0 text-xs font-medium text-transparent transition group-hover:bg-zinc-900/55 group-hover:text-white">
          {url ? "Změnit" : "Nahrát"}
        </span>
      </button>
      {url && (
        <button
          type="button"
          onClick={onClear}
          disabled={disabled}
          className="mt-1.5 text-xs text-red-600 transition hover:text-red-700"
        >
          Odebrat
        </button>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handle(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
