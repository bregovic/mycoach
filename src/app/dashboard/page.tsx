import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppHeader } from "@/components/app-header";

export const metadata = { title: "Přehled" };

type Tile = {
  href: string;
  icon: string;
  title: string;
  desc: string;
  cta: string;
  accent?: boolean;
};

const TILES: Tile[] = [
  { href: "/trening", icon: "🥊", title: "Trénink", desc: "Hlasově řízený intervalový trénink", cta: "Spustit", accent: true },
  { href: "/kalendar", icon: "🗓️", title: "Kalendář", desc: "Plánuj tréninky a úkoly", cta: "Otevřít" },
  { href: "/treninky", icon: "🧱", title: "Moje tréninky", desc: "Skládej vlastní tréninky z bloků", cta: "Otevřít" },
  { href: "/balicky", icon: "📦", title: "Balíčky", desc: "Programy na míru → do kalendáře", cta: "Procházet" },
  { href: "/oddily", icon: "👥", title: "Oddíly", desc: "Skupiny, rozvrh a termíny tréninků", cta: "Otevřít" },
  { href: "/cviky", icon: "📚", title: "Katalog", desc: "Sdílený číselník cviků dle sportu", cta: "Otevřít" },
];

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <main className="min-h-dvh bg-gradient-to-b from-zinc-50 to-zinc-100/40">
      <AppHeader />

      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TILES.map((t) =>
            t.accent ? (
              <Link
                key={t.href}
                href={t.href}
                className="group flex flex-col rounded-2xl bg-zinc-900 p-6 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="text-2xl">{t.icon}</span>
                <h2 className="mt-3 text-lg font-medium">{t.title}</h2>
                <p className="mt-1 text-sm text-zinc-300">{t.desc}</p>
                <span className="mt-6 text-sm font-medium text-zinc-400 transition group-hover:text-white">
                  {t.cta} →
                </span>
              </Link>
            ) : (
              <Link
                key={t.href}
                href={t.href}
                className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
              >
                <span className="text-2xl">{t.icon}</span>
                <h2 className="mt-3 text-lg font-medium text-zinc-900">{t.title}</h2>
                <p className="mt-1 text-sm text-zinc-500">{t.desc}</p>
                <span className="mt-6 text-sm font-medium text-zinc-400 transition group-hover:text-zinc-700">
                  {t.cta} →
                </span>
              </Link>
            ),
          )}
        </div>
      </section>
    </main>
  );
}
