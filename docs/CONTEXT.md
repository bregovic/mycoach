# MyCoach — kontext a směřování

> Stav k **2026-06-17**. Tento dokument je živý přehled: co je hotové, jak to běží a kam míříme. Aktualizuj při větších změnách.

---

## 1. Co to je / vize

**MyCoach** = obecná tréninková / coaching platforma (vznikla z provizorní appky pro hlasově řízený trénink boxu).

**Cílová vize:**
- Přihlášení a profil uživatele.
- Evidence uživatele: **váha, % tuku, historie cvičení → grafy**.
- Výběr **různých sportů / aktivit** pro cvičení.
- **Trenéři** skládají tréninkové plány a balíčky.
- Freemium: něco zdarma, něco placené; plán **na míru po konzultaci** za jiné peníze.

**Princip postupu:** stavět **po fázích**, nejdřív hodnota pro jednoho uživatele (tracker + přehrávač tréninků), **marketplace a platby až nakonec**. Platby zatím **neřešíme** (MVP je zdarma).

---

## 2. Aktuální stav (hotovo)

- ✅ **Kostra**: Next.js 16 + Prisma 7 + Neon Postgres + Auth.js v5.
- ✅ **Přihlášení / registrace** (e-mail + heslo, bcrypt, JWT session), chráněný **`/dashboard`**.
- ✅ **DB zmigrovaná** na Neon (12 tabulek) — viz datový model níže.
- ✅ **`/trening` — hlasový intervalový trenér** (přeneseno z legacy boxu jako obecný engine):
  - generování tréninku z fází/cviků, kola + pauzy, role pro 1–6 lidí, coop režimy;
  - časovač se stavovými barvami + plán (timeline);
  - **český hlas** (SpeechSynthesis) provází koly/pauzami; gong + tikání (Web Audio);
  - tmavý „gym" design z legacy (CSS modul, fonty Teko/Barlow);
  - data: **104 boxerských cviků** v `src/data/box-drills.json`.
- ✅ **Nasazeno**: https://trenal.up.railway.app (auto-deploy z GitHubu).

Legacy originál (čisté HTML/CSS/JS) zůstává jako reference v **`legacy/`**.

---

## 3. Architektura & stack

- **Next.js 16** (App Router, TypeScript, Tailwind v4, Turbopack).
- **Prisma 7** s **driver adapterem** `@prisma/adapter-pg` (Prisma 7 vyžaduje adapter).
- **Neon Postgres** (region EU-central).
- **Auth.js v5** (NextAuth), Credentials provider, `trustHost: true` (běh za proxy).
- **bcryptjs**, **zod**.

**Klíčové soubory:**
- `src/auth.ts` — konfigurace Auth.js (Credentials, JWT, callbacks).
- `src/lib/prisma.ts` — Prisma klient přes pg adapter (`DATABASE_URL`, pooled).
- `src/lib/actions/auth.ts` — server actions: register / login / logout.
- `src/app/{login,register,dashboard,trening}/` — stránky.
- `src/lib/trainer/*` — engine trenéru (čistá logika, bez DOM).
- `src/components/trainer/*` — UI trenéru (časovač, audio, řeč, CSS modul).
- `prisma/schema.prisma` + `prisma.config.ts` — model a config migrací.

---

## 4. Infrastruktura / deploy

- **Repo:** github.com/bregovic/mycoach (větev `main`).
- **Deploy:** `git push origin main` → Railway **auto-deploy**.
- **Railway:** projekt `splendid-commitment`, prostředí (environment) **`MyCoach`**
  (environments tu fungují jako jednotlivé appky vedle DMS/Questea/…),
  služba **`mycoach`** napojená na repo.
- **Veřejná URL:** **https://trenal.up.railway.app** (NE „mycoach-mycoach" — ta neroutuje).
- **Proměnné na Railway** (služba mycoach, env MyCoach): `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`.

**Build na Railway (vyřešené chyby — neopakovat!):**
- Používá **Nixpacks** (`railway.json` → `builder: NIXPACKS`).
- **`nixpacks.toml`** pinuje **`nodejs_22`** (Next 16 / Prisma 7 chtějí Node ≥20; default byl 18)
  a install dělá **`npm install`** místo `npm ci`
  (jinak padá na cross-platform optional balíčcích `@emnapi` z Windows lockfile).
- Build = `prisma generate && next build` (z `package.json`); `next start` poslouchá na `$PORT`.
- Pozn.: `railway logs --build` z CLI **nevrací** build logy — skutečné jsou jen v dashboardu
  (nedej se zmást řádkem „scheduling build…" bez pokračování; build reálně běží).

**Migrace (Prisma 7 + Neon, bez shadow DB):**
```
npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script > prisma/migrations/<ts>_<name>/migration.sql
npx prisma migrate deploy
```
Connection URL pro CLI je v `prisma.config.ts` (`DIRECT_URL`, bez pooleru). Runtime jede přes
adapter s `DATABASE_URL` (pooled). Klient se generuje do `src/generated/prisma` (gitignored,
regeneruje `postinstall` + `build`).

---

## 5. Datový model (Prisma)

- **Auth.js:** `User`, `Account`, `Session`, `VerificationToken` (User má `role`, `passwordHash`).
- **Profil & metriky:** `Profile` (výška, cíl, jednotky), `BodyMetric` (datum, váha, %tuku) → grafy.
- **Katalog:** `Sport`, `Exercise` (vč. `spokenName`, `data` JSON), `Plan` (free/placené, `priceCents`,
  `published`, `trainerId`), `PlanSession`, `Enrollment`.
- **Historie:** `WorkoutLog` (datum, sport, plán, délka, `data` JSON) → grafy/statistiky.

> Pozn.: data trenéru zatím žijí v `src/data/box-drills.json`, ne v DB. Migrace do `Sport`/`Exercise`
> je krok pro více sportů (viz roadmap).

---

## 6. Hlasový trenér — jak funguje

- **Engine** (`src/lib/trainer/generate.ts`): fáze mají váhy a vlastní délku kola/pauzy
  (rozcvička 2 min; kombinace/pytel 3 min; sparring max 4 kola; kondice 45 s Tabata).
  Rozloží čas podle vah, vybírá unikátní cviky (shuffle + reset), počítá kola a **role** (1–6 lidí),
  vkládá pauzy, přípravu a závěr. Vrací pole `Segment[]`.
- **Časovač** (`src/components/trainer/trainer.tsx`): stavový automat, tik po sekundě (refy proti
  stale closures), stavové barvy (práce/pauza/příprava/konec), ovládání play/pauza/zopakovat/skip/reset.
- **Řeč** (`use-speech.ts`): výběr českého hlasu, rychlost, mute; mluví na začátku kola, v pauze
  (hlásí další cvik + pokyn), v půlce kola (výměna rolí / střídání), na konci.
- **Zvuk** (`use-audio.ts`): gong (2×/3×) a tikání (poslední 5 s) generované přes Web Audio
  (žádné soubory). Odemkne se prvním user-gestem (tlačítko Start).

Engine je **sport-agnostický** — box je jen první „disciplína" (dataset).

---

## 7. Roadmap / kam směřujeme

**Fáze 1 — osobní hodnota (teď):**
1. ✅ Kostra + přihlášení + DB.
2. ✅ Hlasový trénink (`/trening`).
3. ⏭ **Uložit odcvičený trénink** do `WorkoutLog` (po dokončení / ručně) → základ historie.
4. ⏭ **Tracker váhy** (`BodyMetric`): zápis + **graf** (Recharts) na dashboardu.
5. ✅ **Profil** uživatele (`/profil`): výška, rok narození, pohlaví, cíl, jednotky (upsert do `Profile`).

**Fáze 2 — obsah a sporty:**
6. ⏭ Přesun cviků z JSON do DB (`Sport` + `Exercise`); **více sportů** (datově řízené disciplíny).
7. ⏭ Výběr sportu/aktivity v UI.
8. ⏭ **Plány zdarma**: trenér/admin složí plán, uživatel si ho „nasadí" (`Enrollment`).

**Fáze 3 — monetizace (později):**
9. ⏭ **Stripe**: placené plány/balíčky → entitlements (až bude o co stát).
10. ⏭ **Marketplace** trenérů + výplaty (Stripe Connect).
11. ⏭ **Plán na míru** po konzultaci (poptávka → konzultace → dodání).

**Drobnosti / UX dluh:**
- Wake-lock na mobilu (aby nezhasla obrazovka během tréninku).
- Lepší výběr/diagnostika hlasů (fallback, test).
- Augmentace typů next-auth (`Session.user.id/role`) místo `typeof` kontrol.

---

## 8. Bezpečnost / TODO

- 🔴 **Rotovat heslo Neon role** — connection string (heslo `npg_…`) prošel chatem → považuj za
  kompromitovaný. Po rotaci aktualizovat `.env` lokálně i proměnné na Railway.
- `.env` je v `.gitignore` (necommituje se). `AUTH_SECRET` je vygenerovaný náhodně.
- Stejný typ TODO existuje u DMS/Questea (rotace leaknutých tajemství).

---

## 9. Lokální vývoj

```
npm install
npm run dev        # http://localhost:3000
npm run build      # prisma generate && next build (ověření před push)
```
`.env` potřebuje `DATABASE_URL` (pooled), `DIRECT_URL` (direct, bez pooleru), `AUTH_SECRET`.
Migrace viz sekce 4.
