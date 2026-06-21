// Sdílené logo MyCoach – značka (činka) + textová část. Bez klientských hooků.

export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="#18181b" />
      <g fill="#ffffff">
        <rect x="10" y="14" width="12" height="4" rx="2" />
        <rect x="7" y="10" width="3" height="12" rx="1.5" />
        <rect x="22" y="10" width="3" height="12" rx="1.5" />
        <rect x="4" y="12.5" width="2.5" height="7" rx="1.25" />
        <rect x="25.5" y="12.5" width="2.5" height="7" rx="1.25" />
      </g>
    </svg>
  );
}

export function Brand({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark className="h-7 w-7" />
      <span className="text-lg font-semibold tracking-tight text-zinc-900">MyCoach</span>
    </span>
  );
}
