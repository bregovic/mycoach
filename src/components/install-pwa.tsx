"use client";

import { useEffect, useState } from "react";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function InstallPwa() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) {
      setInstalled(true);
      return;
    }
    setIsIOS(/iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase()));
    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return <p className="text-sm text-green-600">Aplikace je nainstalovaná ✅</p>;

  if (deferred) {
    return (
      <button
        type="button"
        onClick={async () => {
          await deferred.prompt();
          setDeferred(null);
        }}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
      >
        📲 Nainstalovat do mobilu
      </button>
    );
  }

  if (isIOS) {
    return (
      <p className="text-sm text-zinc-500">
        Na iPhonu otevři v Safari → <strong>Sdílet</strong> → <strong>Přidat na plochu</strong>.
      </p>
    );
  }

  return (
    <p className="text-sm text-zinc-400">
      Otevři appku v Chrome na mobilu — nabídne <strong>Přidat na plochu</strong> (nebo v menu prohlížeče zvol Instalovat).
    </p>
  );
}
