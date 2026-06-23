// Číselník kategorií balíčků (slug → český název) pro filtrování a vyhledávání.
export const CATEGORY_LABELS: Record<string, string> = {
  krasa: "Krása",
  fitness: "Fitness",
  zdravi: "Zdraví",
  relax: "Relax",
  vyziva: "Výživa",
};

export function categoryLabel(slug: string | null | undefined): string | null {
  if (!slug) return null;
  return CATEGORY_LABELS[slug] ?? slug;
}
