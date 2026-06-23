-- Lifestyle balíčky: Mužská péče, Duševní pohoda (idempotentně dle id).
INSERT INTO "Package" (id, slug, title, subtitle, description, category, tags, icon, color, "authorId", "isFree", published, "updatedAt") VALUES
  ('pkg_muzska_pece','muzska-pece','Mužská péče','Vzhled a péče','Pravidelná péče o vlasy, vousy a pleť – ať jsi vždy upravený.','pece', ARRAY['muž','péče','vzhled'], '🧔','#3f3f46', NULL, true, true, CURRENT_TIMESTAMP),
  ('pkg_dusevni_pohoda','dusevni-pohoda','Duševní pohoda','Klid a regenerace mysli','Drobné denní návyky pro míň stresu a víc pohody.','pohoda', ARRAY['psychika','klid','mindfulness'], '🧘','#8b5cf6', NULL, true, true, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

INSERT INTO "PackageElement" (id, "packageId", "order", name, note, color, "defaultIntervalDays", optional) VALUES
  -- Mužská péče
  ('pel_mp_holic',   'pkg_muzska_pece', 0, 'Holič / střih',     'Střih vlasů zhruba po 4 týdnech.',           '#3f3f46', 28, false),
  ('pel_mp_vousy',   'pkg_muzska_pece', 1, 'Úprava vousů',      'Zastřižení a kontura vousů.',                '#52525b', 14, false),
  ('pel_mp_plet',    'pkg_muzska_pece', 2, 'Pleťový krém',      'Denně ráno – hydratace pleti.',              '#06b6d4', 1,  false),
  ('pel_mp_olej',    'pkg_muzska_pece', 3, 'Olej na vousy',     'Denně – vousy i pokožka pod nimi.',          '#a16207', 1,  true),
  ('pel_mp_nehty',   'pkg_muzska_pece', 4, 'Nehty a ruce',      'Stříhání nehtů a péče o ruce.',              '#71717a', 14, true),
  ('pel_mp_ziletka', 'pkg_muzska_pece', 5, 'Výměna žiletky',    'Vyměnit žiletku ~1× týdně.',                 '#0ea5e9', 7,  true),
  ('pel_mp_pedikura','pkg_muzska_pece', 6, 'Pedikúra',          'Péče o nohy.',                               '#14b8a6', 56, true),
  -- Duševní pohoda
  ('pel_dp_meditace','pkg_dusevni_pohoda', 0, 'Meditace',         '5–10 minut denně, zklidnění mysli.',       '#8b5cf6', 1, false),
  ('pel_dp_denik',   'pkg_dusevni_pohoda', 1, 'Deník vděčnosti',  'Večer 3 věci, za které jsi vděčný.',       '#a855f7', 1, false),
  ('pel_dp_prochazka','pkg_dusevni_pohoda',2, 'Procházka v přírodě','Pohyb venku, načerpání energie.',         '#22c55e', 2, false),
  ('pel_dp_dech',    'pkg_dusevni_pohoda', 3, 'Dechové cvičení',  'Pár minut – rychlé snížení stresu.',       '#06b6d4', 1, true),
  ('pel_dp_detox',   'pkg_dusevni_pohoda', 4, 'Digitální detox',  '1× týdně večer/den bez obrazovek.',        '#f97316', 7, false),
  ('pel_dp_konicek', 'pkg_dusevni_pohoda', 5, 'Čas pro sebe',     'Vyhradit si čas na koníček nebo odpočinek.','#ec4899', 7, true),
  ('pel_dp_spanek',  'pkg_dusevni_pohoda', 6, 'Kvalitní spánek',  'Pravidelný čas chození spát, 7–8 hodin.',  '#6366f1', 1, false)
ON CONFLICT (id) DO NOTHING;
