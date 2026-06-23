-- Příkladový balíček „Ženská krása" (idempotentně dle slug / id).
INSERT INTO "Package"
  (id, slug, title, subtitle, description, category, tags, icon, color, "isFree", published, "createdAt", "updatedAt")
VALUES
  ('pkg_zenska_krasa', 'zenska-krasa', 'Ženská krása', 'Pravidelná péče o sebe',
   'Ucelený program péče o vzhled a pohodu. Vyber si, co tě zajímá, uprav frekvenci a po potvrzení se ti návštěvy zařadí do kalendáře jako připomínky.',
   'krasa', ARRAY['zena','krasa','pece','kosmetika','wellness'], '💄', '#ec4899',
   true, true, now(), now())
ON CONFLICT (slug) DO NOTHING;

INSERT INTO "PackageElement"
  (id, "packageId", "order", name, note, color, "defaultIntervalDays", optional)
VALUES
  ('pel_kadernik',  'pkg_zenska_krasa', 0, 'Kadeřník',  'Střih a péče o vlasy',   '#f59e0b', 42, true),
  ('pel_kosmetika', 'pkg_zenska_krasa', 1, 'Kosmetika', 'Ošetření a čištění pleti','#ec4899', 28, true),
  ('pel_pedikura',  'pkg_zenska_krasa', 2, 'Pedikúra',  'Péče o nohy',            '#8b5cf6', 35, true),
  ('pel_manikura',  'pkg_zenska_krasa', 3, 'Manikúra',  'Péče o nehty',           '#06b6d4', 21, true),
  ('pel_masaz',     'pkg_zenska_krasa', 4, 'Masáž',     'Relaxační masáž',        '#22c55e', 14, true)
ON CONFLICT (id) DO NOTHING;
