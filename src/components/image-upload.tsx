"use client";

import { useRef, useState, type DragEvent } from "react";
import { ImageCropper } from "./image-cropper";

// Upload obrázku (logo tréninku) s interaktivním ořezem (zoom/posun) – stejný
// cropper jako profilovka, jen čtvercový zaoblený výřez.
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
  const [editSrc, setEditSrc] = useState<string | null>(null);

  function loadFile(file: File | null | undefined) {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Vyber obrázek.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setEditSrc(String(reader.result));
    reader.onerror = () => setError("Obrázek se nepodařilo načíst.");
    reader.readAsDataURL(file);
  }

  if (editSrc) {
    return (
      <ImageCropper
        src={editSrc}
        shape="square"
        stack
        pending={disabled}
        onConfirm={(dataUrl) => {
          setEditSrc(null);
          onPick(dataUrl);
        }}
        onCancel={() => setEditSrc(null)}
      />
    );
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
          loadFile(e.dataTransfer.files?.[0]);
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
          loadFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
