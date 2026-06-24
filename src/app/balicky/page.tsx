import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";
import { CATEGORY_LABELS } from "@/lib/packages";
import { createPackage } from "@/lib/actions/packages";

export const metadata = { title: "Balíčky" };

export default async function PackagesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const { q, cat } = await searchParams;
  const query = (q ?? "").trim().toLowerCase();

  const [packages, subs] = await Promise.all([
    prisma.package.findMany({
      where: {
        OR: [{ published: true }, { authorId: userId }],
        ...(cat ? { category: cat } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { elements: true } }, author: { select: { name: true } } },
    }),
    prisma.subscription.findMany({ where: { userId }, select: { packageId: true } }),
  ]);

  const subscribed = new Set(subs.map((s) => s.packageId));

  const filtered = query
    ? packages.filter((p) =>
        [p.title, p.subtitle, p.description, ...p.tags]
          .filter(Boolean)
          .some((t) => t!.toLowerCase().includes(query)),
      )
    : packages;

  const categories = Object.entries(CATEGORY_LABELS);

  return (
    <main className="min-h-dvh bg-gradient-to-b from-zinc-50 to-zinc-100/40">
      <AppHeader back={{ href: "/dashboard", label: "Balíčky" }} />

      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Balíčky</h1>
            <p className="mt-1 text-zinc-500">
              Hotové programy, na které se přihlásíš a přizpůsobíš si je. Po potvrzení se zařadí do
              kalendáře.
            </p>
          </div>
          <form action={createPackage}>
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              + Vytvořit
            </button>
          </form>
        </div>

        {/* Hledání */}
        <form className="mt-6 flex gap-2" action="/balicky">
          {cat && <input type="hidden" name="cat" value={cat} />}
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Hledat balíček, tag…"
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-500"
          />
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            Hledat
          </button>
        </form>

        {/* Kategorie */}
        <div className="mt-4 flex flex-wrap gap-2">
          <CatChip label="Vše" href={catHref(undefined, q)} active={!cat} />
          {categories.map(([slug, label]) => (
            <CatChip key={slug} label={label} href={catHref(slug, q)} active={cat === slug} />
          ))}
        </div>

        {/* Výpis */}
        {filtered.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
            <p className="text-zinc-500">Žádný balíček neodpovídá hledání.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {filtered.map((p) => (
              <Link
                key={p.id}
                href={`/balicky/${p.slug}`}
                className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
                    style={{ background: `${p.color}1a` }}
                  >
                    {p.icon ?? "📦"}
                  </div>
                  {subscribed.has(p.id) ? (
                    <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                      Odebíráš
                    </span>
                  ) : (
                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
                      {p.isFree ? "Zdarma" : "Placené"}
                    </span>
                  )}
                </div>
                <h2 className="mt-3 text-lg font-medium text-zinc-900">{p.title}</h2>
                {p.subtitle && <p className="mt-0.5 text-sm text-zinc-500">{p.subtitle}</p>}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.tags.slice(0, 4).map((t) => (
                    <span key={t} className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                      #{t}
                    </span>
                  ))}
                </div>
                <span className="mt-4 text-xs text-zinc-400">
                  {p._count.elements} prvků{p.author?.name ? ` · ${p.author.name}` : ""}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function catHref(cat: string | undefined, q: string | undefined): string {
  const sp = new URLSearchParams();
  if (cat) sp.set("cat", cat);
  if (q) sp.set("q", q);
  const s = sp.toString();
  return s ? `/balicky?${s}` : "/balicky";
}

function CatChip({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-zinc-900 text-white"
          : "border border-zinc-300 text-zinc-600 hover:bg-zinc-100"
      }`}
    >
      {label}
    </Link>
  );
}
