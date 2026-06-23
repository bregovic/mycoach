-- Další prvky do balíčku „Ženská krása" (idempotentně dle id).
INSERT INTO "PackageElement" (id, "packageId", "order", name, note, color, "defaultIntervalDays", optional) VALUES
  ('pel_zk_oblicej',       'pkg_zenska_krasa', 5,  'Krém na obličej',  'Denní hydratace pleti',        '#ec4899', 1,  true),
  ('pel_zk_telo',          'pkg_zenska_krasa', 6,  'Tělové mléko',     'Po sprše, hydratace',          '#f472b6', 1,  true),
  ('pel_zk_kosmetolog',    'pkg_zenska_krasa', 7,  'Kosmetolog',       'Estetické ošetření pleti',     '#d946ef', 56, true),
  ('pel_zk_oboci_rasy',    'pkg_zenska_krasa', 8,  'Obočí a řasy',     'Úprava, barvení, lash lift',   '#a855f7', 28, true),
  ('pel_zk_depilace',      'pkg_zenska_krasa', 9,  'Depilace',         'Epilace / voskování',          '#fb7185', 28, true),
  ('pel_zk_vlasova_kura',  'pkg_zenska_krasa', 10, 'Vlasová kúra',     'Maska a regenerace vlasů',     '#f59e0b', 7,  true),
  ('pel_zk_peeling',       'pkg_zenska_krasa', 11, 'Tělový peeling',   'Hladká pokožka',               '#fbbf24', 14, true),
  ('pel_zk_sauna',         'pkg_zenska_krasa', 12, 'Sauna / wellness', 'Relax a regenerace',           '#ef4444', 7,  true),
  ('pel_zk_lymfo',         'pkg_zenska_krasa', 13, 'Lymfatická masáž', 'Detox a prokrvení',            '#22c55e', 21, true),
  ('pel_zk_hydratace',     'pkg_zenska_krasa', 14, 'Pitný režim',      'Dostatek vody každý den',      '#06b6d4', 1,  true)
ON CONFLICT (id) DO NOTHING;
