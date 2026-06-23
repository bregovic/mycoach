// Sdílené číselníky metadat tréninku (obtížnost) pro editor, výpisy i veřejné stránky.
export const DIFFICULTY_LABELS: Record<string, string> = {
  zacatecnik: "Začátečník",
  mirne_pokrocily: "Mírně pokročilý",
  pokrocily: "Pokročilý",
  expert: "Expert",
};

export const DIFFICULTY_ORDER = ["zacatecnik", "mirne_pokrocily", "pokrocily", "expert"];

export function difficultyLabel(slug: string | null | undefined): string | null {
  if (!slug) return null;
  return DIFFICULTY_LABELS[slug] ?? slug;
}
