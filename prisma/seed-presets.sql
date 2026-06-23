-- Katalog prvků (lookup), ze kterého si uživatel přidává do svého odběru.
INSERT INTO "ElementPreset" (id, name, note, color, "defaultIntervalDays", category, "createdAt") VALUES
  ('epr_kadernik',  'Kadeřník',        'Střih a péče o vlasy',     '#f59e0b', 42, 'krasa',  now()),
  ('epr_kosmetika', 'Kosmetika',       'Ošetření a čištění pleti', '#ec4899', 28, 'krasa',  now()),
  ('epr_pedikura',  'Pedikúra',        'Péče o nohy',              '#8b5cf6', 35, 'krasa',  now()),
  ('epr_manikura',  'Manikúra',        'Péče o nehty',             '#06b6d4', 21, 'krasa',  now()),
  ('epr_masaz',     'Masáž',           'Relaxační masáž',          '#22c55e', 14, 'relax',  now()),
  ('epr_sauna',     'Sauna',           'Saunování',                '#ef4444', 7,  'relax',  now()),
  ('epr_solarium',  'Solárium',        NULL,                       '#f97316', 14, 'krasa',  now()),
  ('epr_kosmetolog','Kosmetolog',      'Estetické ošetření',       '#d946ef', 56, 'krasa',  now()),
  ('epr_zubar',     'Zubař',           'Dentální hygiena/prohlídka','#3b82f6', 182,'zdravi', now()),
  ('epr_prohlidka', 'Lékařská prohlídka','Preventivní prohlídka',  '#0ea5e9', 365,'zdravi', now()),
  ('epr_ocni',      'Oční vyšetření',  NULL,                       '#14b8a6', 365,'zdravi', now()),
  ('epr_fyzio',     'Fyzioterapie',    'Rehabilitace',             '#10b981', 14, 'zdravi', now()),
  ('epr_kondice',   'Kondiční trénink',NULL,                       '#84cc16', 3,  'fitness',now()),
  ('epr_vyziva',    'Konzultace výživy',NULL,                      '#eab308', 30, 'vyziva', now())
ON CONFLICT (id) DO NOTHING;
