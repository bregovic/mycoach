// Zobrazení avataru – obrázek (data URL v User.image), nebo iniciály jako fallback.
// Čistá komponenta bez hooků → použitelná i v server komponentách.

function initialsOf(name?: string | null): string {
  const src = (name ?? "").trim();
  if (!src) return "?";
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

export function Avatar({
  src,
  name,
  size = 36,
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
}) {
  const dim = { width: size, height: size };
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- data URL, ne externí zdroj
      <img
        src={src}
        alt=""
        style={dim}
        className="shrink-0 rounded-full object-cover ring-1 ring-zinc-200"
      />
    );
  }
  return (
    <span
      style={{ ...dim, fontSize: Math.round(size * 0.4) }}
      className="inline-flex shrink-0 select-none items-center justify-center rounded-full bg-zinc-200 font-semibold text-zinc-600 ring-1 ring-zinc-200"
      aria-hidden
    >
      {initialsOf(name)}
    </span>
  );
}
