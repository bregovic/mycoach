"use client";

import { useRef, useState, useTransition, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { removeAvatarAction, updateAvatarAction } from "@/lib/actions/avatar";
import { Avatar } from "./avatar";

const SIZE = 256; // cílová strana čtverce v px

/** Načte soubor, ořízne na čtverec (cover, na střed) a vrátí JPEG data URL. */
async function resizeToSquare(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  const scale = Math.max(SIZE / bitmap.width, SIZE / bitmap.height);
  const w = bitmap.width * scale;
  const h = bitmap.height * scale;
  ctx.drawImage(bitmap, (SIZE - w) / 2, (SIZE - h) / 2, w, h);
  bitmap.close?.();
  return canvas.toDataURL("image/jpeg", 0.85);
}

export function AvatarUploader({
  src,
  name,
}: {
  src: string | null;
  name: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState<string | null>(src);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined | null) {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Vyber prosím obrázek.");
      return;
    }
    try {
      const dataUrl = await resizeToSquare(file);
      if (dataUrl.length > 300_000) {
        setError("Obrázek se nepodařilo zmenšit dostatečně.");
        return;
      }
      setPreview(dataUrl);
      startTransition(async () => {
        await updateAvatarAction(dataUrl);
        router.refresh();
      });
    } catch {
      setError("Obrázek se nepodařilo načíst.");
    }
  }

  function onDrop(e: DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setDrag(false);
    handleFile(e.dataTransfer.files?.[0]);
  }

  function remove() {
    setPreview(null);
    setError(null);
    startTransition(async () => {
      await removeAvatarAction();
      router.refresh();
    });
  }

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
        onDrop={onDrop}
        className={`group relative h-24 w-24 shrink-0 overflow-hidden rounded-full ring-2 transition ${
          drag ? "ring-zinc-900" : "ring-zinc-200 hover:ring-zinc-400"
        }`}
        aria-label="Nahrát profilovou fotku"
      >
        <Avatar src={preview} name={name} size={96} />
        <span className="absolute inset-0 flex items-center justify-center bg-zinc-900/0 text-xs font-medium text-transparent transition group-hover:bg-zinc-900/55 group-hover:text-white">
          {preview ? "Změnit" : "Nahrát"}
        </span>
      </button>

      <div className="min-w-0">
        <p className="text-sm text-zinc-600">
          Přetáhni fotku na kolečko, nebo klikni a vyber soubor.
        </p>
        <p className="mt-0.5 text-xs text-zinc-400">JPG, PNG nebo WebP. Ořízne se na čtverec.</p>
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
          >
            Vybrat fotku
          </button>
          {preview && (
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
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
