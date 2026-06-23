// Technické zvukové pokyny (cue) – opakující se momenty tréninku.
// U každého typu může být víc MP3 → v přehrávači se náhodně střídají.
export const SOUND_CUES = [
  { key: "start", label: "Start tréninku", hint: "Na úplném začátku" },
  { key: "round_start", label: "Začátek kola", hint: "Když začíná pracovní úsek" },
  { key: "round_end", label: "Konec kola", hint: "Když kolo končí (jde se do pauzy)" },
  { key: "rest", label: "Pauza / odpočinek", hint: "Během pauzy" },
  { key: "half_swap", label: "Výměna v půlce", hint: "V půlce kola – „na znamení se vyměníme“" },
  { key: "switch", label: "Střídání techniky", hint: "V půlce kola – střídavý režim" },
  { key: "countdown", label: "Odpočet", hint: "Posledních pár vteřin úseku" },
  { key: "finish", label: "Konec tréninku", hint: "Na konci" },
] as const;

export type SoundKey = (typeof SOUND_CUES)[number]["key"];

export const SOUND_KEYS: string[] = SOUND_CUES.map((c) => c.key);

/** URL pro přehrání uživatelského zvuku (přes přihlášený endpoint). */
export function soundUrl(key: string): string {
  return `/api/user-sound?key=${encodeURIComponent(key)}`;
}
