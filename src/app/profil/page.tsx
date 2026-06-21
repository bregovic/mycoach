import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm, type ProfileValues } from "@/components/profile-form";
import { WeightForm } from "@/components/weight-form";
import { WeightChart, type WeightPoint } from "@/components/weight-chart";
import { calcAge, calcBmi, bmiCategory, type BmiTone } from "@/lib/health";

const toneClasses: Record<BmiTone, string> = {
  blue: "bg-blue-50 text-blue-700",
  green: "bg-green-50 text-green-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
};

function StatTile({
  label,
  value,
  unit,
  hint,
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight text-zinc-900">
        {value}
        {unit && value !== "—" && <span className="ml-1 text-base font-normal text-zinc-400">{unit}</span>}
      </p>
      {hint && <div className="mt-1">{hint}</div>}
    </div>
  );
}

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [profile, metrics] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.bodyMetric.findMany({
      where: { userId },
      orderBy: { date: "asc" },
      select: { date: true, weightKg: true, bodyFat: true },
    }),
  ]);
  const latest = metrics.at(-1) ?? null;

  const dayMonth = new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "numeric" });
  const chartData: WeightPoint[] = metrics
    .filter((m) => m.weightKg != null)
    .map((m) => ({
      label: dayMonth.format(m.date),
      weightKg: Number(m.weightKg),
      bodyFat: m.bodyFat != null ? Number(m.bodyFat) : null,
    }));
  const showBodyFat = chartData.some((d) => d.bodyFat != null);

  const values: ProfileValues = {
    heightCm: profile?.heightCm ?? null,
    birthYear: profile?.birthYear ?? null,
    sex: profile?.sex ?? null,
    goal: profile?.goal ?? null,
    unit: profile?.unit ?? "metric",
  };

  const weightKg = latest?.weightKg != null ? Number(latest.weightKg) : null;
  const bodyFat = latest?.bodyFat != null ? Number(latest.bodyFat) : null;
  const age = calcAge(profile?.birthYear);
  const bmi = calcBmi(weightKg, profile?.heightCm);
  const cat = bmiCategory(bmi);

  const lastDate = latest?.date
    ? new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" }).format(latest.date)
    : null;

  return (
    <main className="min-h-dvh bg-zinc-50">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight text-zinc-900">
          MyCoach
        </Link>
        <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-zinc-900">
          ← Zpět na přehled
        </Link>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Profil</h1>
        <p className="mt-2 text-zinc-600">Tvůj aktuální přehled a osobní údaje.</p>

        {/* Přehled */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Aktuální váha" value={weightKg != null ? String(weightKg) : "—"} unit="kg"
            hint={lastDate && <span className="text-xs text-zinc-400">{lastDate}</span>} />
          <StatTile label="Výška" value={profile?.heightCm != null ? String(profile.heightCm) : "—"} unit="cm" />
          <StatTile label="Věk" value={age != null ? String(age) : "—"} unit="let" />
          <StatTile label="BMI" value={bmi != null ? String(bmi) : "—"}
            hint={cat && (
              <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${toneClasses[cat.tone]}`}>
                {cat.label}
              </span>
            )} />
        </div>
        {bmi == null && (
          <p className="mt-2 text-xs text-zinc-400">
            BMI se spočítá, jakmile vyplníš výšku a zapíšeš váhu.
          </p>
        )}

        {/* Graf vývoje váhy */}
        <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-900">Vývoj váhy</h2>
            {showBodyFat && (
              <div className="flex items-center gap-4 text-xs text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-zinc-900" /> váha
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-500" /> % tuku
                </span>
              </div>
            )}
          </div>
          {chartData.length >= 2 ? (
            <WeightChart data={chartData} showBodyFat={showBodyFat} />
          ) : (
            <p className="py-8 text-center text-sm text-zinc-400">
              Zapiš aspoň dva záznamy váhy a uvidíš tu graf vývoje.
            </p>
          )}
        </div>

        {/* Zápis váhy */}
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-base font-semibold text-zinc-900">Zapsat váhu</h2>
          <p className="mt-1 mb-4 text-sm text-zinc-500">
            Každý záznam se ukládá do historie — později z ní bude graf.
          </p>
          <WeightForm />
        </div>

        {/* Údaje profilu */}
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-base font-semibold text-zinc-900">Údaje profilu</h2>
          <p className="mt-1 mb-4 text-sm text-zinc-500">Slouží k výpočtům a personalizaci. Vše je nepovinné.</p>
          <ProfileForm values={values} />
        </div>
      </section>
    </main>
  );
}
