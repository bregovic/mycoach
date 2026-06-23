// Naplní číselník Sport(Box) + Exercise z src/data/box-drills.json.
// Generovaný Prisma klient je TS, tak jdeme přímo přes `pg` (DIRECT_URL).
// Idempotentní: stabilní id `ex_box_<kategorie>_<index>` + ON CONFLICT DO NOTHING.
import "dotenv/config";
import pg from "pg";
import { readFileSync } from "node:fs";

const drills = JSON.parse(
  readFileSync(new URL("../src/data/box-drills.json", import.meta.url), "utf8"),
);

const DEFAULT_SEC = { warmup: 120, combinations: 180, bag_work: 180, sparring: 180, conditioning: 45 };

function normCoop(v) {
  const s = String(v ?? "najednou")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
  if (s === "stridave") return "stridave";
  if (s === "v_pulce") return "v_pulce";
  if (s === "cele_kolo") return "cele_kolo";
  return "najednou";
}

const client = new pg.Client({ connectionString: process.env.DIRECT_URL });
await client.connect();

await client.query(
  `INSERT INTO "Sport" (id, slug, name, icon) VALUES ('sport_box','box','Box','🥊')
   ON CONFLICT (slug) DO NOTHING`,
);
const { rows } = await client.query(`SELECT id FROM "Sport" WHERE slug='box'`);
const sportId = rows[0].id;

let n = 0;
for (const [cat, arr] of Object.entries(drills)) {
  if (!Array.isArray(arr)) continue;
  for (let i = 0; i < arr.length; i++) {
    const d = arr[i];
    await client.query(
      `INSERT INTO "Exercise" (id, "sportId", name, "spokenName", "voiceText", category, coop, "defaultSec", "createdAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now()) ON CONFLICT (id) DO NOTHING`,
      [
        `ex_box_${cat}_${i}`,
        sportId,
        String(d.name ?? ""),
        String(d.spokenName ?? d.name ?? ""),
        String(d.voiceText ?? ""),
        cat,
        normCoop(d.coop),
        DEFAULT_SEC[cat] ?? 120,
      ],
    );
    n++;
  }
}
console.log(`Seed OK: sport box, ${n} cviků`);
await client.end();
