-- Nové systémové balíčky (idempotentně dle id). authorId NULL = systémový, published.
INSERT INTO "Package" (id, slug, title, subtitle, description, category, tags, icon, color, "authorId", "isFree", published, "updatedAt") VALUES
  ('pkg_doplnky_30','doplnky-30','Výživové doplňky 30+','Základní suplementace','Co a kdy brát po třicítce – základní doplňky pro energii, regeneraci a imunitu.','zdravi', ARRAY['doplňky','suplementy','30+'], '💊','#16a34a', NULL, true, true, CURRENT_TIMESTAMP),
  ('pkg_doplnky_40','doplnky-40','Výživové doplňky 40+','Rozšířená suplementace','Po čtyřicítce navíc srdce, klouby, kosti a trávení.','zdravi', ARRAY['doplňky','suplementy','40+'], '💊','#0d9488', NULL, true, true, CURRENT_TIMESTAMP),
  ('pkg_zdravi_prevence','zdravotni-prevence','Zdravotní prevence','Preventivní prohlídky','Ke kterému lékaři na prevenci a jak často – ať nic neutečete.','zdravi', ARRAY['prevence','lékař','zdraví'], '🩺','#0284c7', NULL, true, true, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

INSERT INTO "PackageElement" (id, "packageId", "order", name, note, color, "defaultIntervalDays", optional) VALUES
  -- Výživové doplňky 30+
  ('pel_d30_kreatin',  'pkg_doplnky_30', 0, 'Kreatin',       '3–5 g denně, kdykoli – i ve dnech bez tréninku.',          '#16a34a', 1, false),
  ('pel_d30_d3',       'pkg_doplnky_30', 1, 'Vitamín D3',    '1000–2000 IU ráno s jídlem obsahujícím tuk.',              '#22c55e', 1, false),
  ('pel_d30_omega',    'pkg_doplnky_30', 2, 'Omega‑3',       '1–2 g EPA+DHA s jídlem.',                                   '#0ea5e9', 1, false),
  ('pel_d30_horcik',   'pkg_doplnky_30', 3, 'Hořčík',        '300–400 mg večer – podpora svalů a spánku.',               '#8b5cf6', 1, false),
  ('pel_d30_multi',    'pkg_doplnky_30', 4, 'Multivitamín',  'Ráno s jídlem.',                                            '#f59e0b', 1, true),
  ('pel_d30_ashwa',    'pkg_doplnky_30', 5, 'Ashwagandha',   '300–600 mg, kúra 6–8 týdnů, pak pauza. Na stres a spánek.', '#a855f7', 1, true),
  ('pel_d30_protein',  'pkg_doplnky_30', 6, 'Protein',       'Doplněk bílkovin dle potřeby (po tréninku/k snídani).',     '#ef4444', 1, true),
  -- Výživové doplňky 40+
  ('pel_d40_kreatin',  'pkg_doplnky_40', 0, 'Kreatin',       '3–5 g denně, kdykoli.',                                     '#0d9488', 1, false),
  ('pel_d40_d3k2',     'pkg_doplnky_40', 1, 'Vitamín D3 + K2','D3 2000 IU s K2 ráno – kosti a cévy.',                     '#22c55e', 1, false),
  ('pel_d40_omega',    'pkg_doplnky_40', 2, 'Omega‑3',       '1–2 g EPA+DHA s jídlem.',                                   '#0ea5e9', 1, false),
  ('pel_d40_horcik',   'pkg_doplnky_40', 3, 'Hořčík',        '300–400 mg večer.',                                         '#8b5cf6', 1, false),
  ('pel_d40_q10',      'pkg_doplnky_40', 4, 'Koenzym Q10',   '100 mg ráno – srdce a energie.',                            '#f97316', 1, false),
  ('pel_d40_klouby',   'pkg_doplnky_40', 5, 'Kloubní výživa','Kolagen + glukosamin denně – na klouby.',                  '#eab308', 1, false),
  ('pel_d40_probio',   'pkg_doplnky_40', 6, 'Probiotika',    'Ráno nalačno – trávení a imunita.',                         '#14b8a6', 1, true),
  ('pel_d40_multi',    'pkg_doplnky_40', 7, 'Multivitamín 40+','Ráno s jídlem.',                                          '#f59e0b', 1, true),
  ('pel_d40_vlaknina', 'pkg_doplnky_40', 8, 'Vláknina',      'Psyllium, dostatek vody.',                                  '#84cc16', 1, true),
  -- Zdravotní prevence
  ('pel_zp_praktik',   'pkg_zdravi_prevence', 0, 'Praktický lékař',   'Preventivní prohlídka 1× za 2 roky.',              '#0284c7', 730, false),
  ('pel_zp_zubar',     'pkg_zdravi_prevence', 1, 'Zubař',             'Prohlídka 2× ročně.',                              '#0ea5e9', 182, false),
  ('pel_zp_hygiena',   'pkg_zdravi_prevence', 2, 'Dentální hygiena',  '2× ročně.',                                        '#38bdf8', 182, true),
  ('pel_zp_kuze',      'pkg_zdravi_prevence', 3, 'Kožní – znaménka',  'Kontrola znamének 1× ročně.',                      '#f43f5e', 365, false),
  ('pel_zp_oci',       'pkg_zdravi_prevence', 4, 'Oční vyšetření',    '1× za 2 roky (dříve při potížích).',               '#6366f1', 730, true),
  ('pel_zp_krev',      'pkg_zdravi_prevence', 5, 'Krevní testy',      'Cholesterol, cukr, krevní obraz 1× ročně.',        '#ef4444', 365, false),
  ('pel_zp_tlak',      'pkg_zdravi_prevence', 6, 'Krevní tlak',       'Změřit doma 1× měsíčně.',                          '#f97316', 30, true),
  ('pel_zp_genurolog', 'pkg_zdravi_prevence', 7, 'Gynekolog / Urolog','Preventivní prohlídka 1× ročně.',                  '#a855f7', 365, false)
ON CONFLICT (id) DO NOTHING;
