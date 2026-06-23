"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { SOUND_CUES, soundUrl } from "@/lib/sounds";
import { deleteUserSound, uploadUserSound } from "@/lib/actions/sounds";

export interface SoundItem {
  id: string;
  key: string;
}

export function SoundSettings({ byType }: { byType: Record<string, SoundItem[]> }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function upload(type: string, file: File | null | undefined) {
    if (!file) return;
    const fd = new FormData();
    fd.set("type", type);
    fd.set("file", file);
    startTransition(async () => {
      await uploadUserSound(fd);
      router.refresh();
    });
  }
  function remove(id: string) {
    startTransition(async () => {
      await deleteUserSound(id);
      router.refresh();
    });
  }

  return (
    <div className={`space-y-3 ${pending ? "opacity-60" : ""}`}>
      <p className="text-sm text-zinc-500">
        Nahraj si vlastní hlášky pro opakující se momenty. Když k jednomu typu nahraješ víc nahrávek,
        v tréninku se budou <strong>náhodně střídat</strong>. Bez nahrávky zůstane výchozí gong/hlas.
      </p>

      {SOUND_CUES.map((cue) => {
        const items = byType[cue.key] ?? [];
        return (
          <div key={cue.key} className="rounded-xl border border-zinc-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-zinc-900">{cue.label}</p>
                <p className="text-xs text-zinc-400">{cue.hint}</p>
              </div>
              <label className="inline-flex cursor-pointer items-center rounded-lg border border-dashed border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-zinc-400 hover:bg-zinc-50">
                + Nahrát MP3
                <input
                  type="file"
                  accept="audio/mpeg,.mp3"
                  className="hidden"
                  onChange={(e) => {
                    upload(cue.key, e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>

            {items.length > 0 && (
              <ul className="mt-3 space-y-2">
                {items.map((s, i) => (
                  <li key={s.id} className="flex flex-wrap items-center gap-3">
                    <span className="text-xs text-zinc-400">#{i + 1}</span>
                    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                    <audio controls src={soundUrl(s.key)} className="h-8 max-w-full" />
                    <button type="button" onClick={() => remove(s.id)} className="text-xs text-red-600 transition hover:text-red-700">
                      Odebrat
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
