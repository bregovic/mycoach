"use client";

import { useRef, useState, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { removeAvatarAction, updateAvatarAction } from "@/lib/actions/avatar";
import { Avatar } from "./avatar";
import { ImageCropper } from "./image-cropper";

export function AvatarUploader({ src, name }: { src: string | null; name: string | null }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editSrc, setEditSrc] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  function saveCrop(dataUrl: string) {
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

  if (editSrc) {
    return (
      <ImageCropper
        src={editSrc}
        shape="circle"
        pending={pending}
        onConfirm={saveCrop}
        onCancel={() => {
          setEditSrc(null);
          setError(null);
        }}
      />
    );
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
            <button type="button" onClick={remove} className="text-sm text-red-600 transition hover:text-red-700">
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
