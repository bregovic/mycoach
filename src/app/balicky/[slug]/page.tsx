import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";
import { categoryLabel } from "@/lib/packages";
import {
  PackageSubscribe,
  type ElementView,
  type ExistingRow,
  type PresetView,
} from "@/components/packages/package-subscribe";

export const metadata = { title: "Balíček" };

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const { slug } = await params;
  const pkg = await prisma.package.findFirst({
    where: { slug, OR: [{ published: true }, { authorId: userId }] },
    include: {
      author: { select: { name: true } },
      elements: { orderBy: { order: "asc" } },
    },
  });
  if (!pkg) notFound();

  const [subscription, presetRows] = await Promise.all([
    prisma.subscription.findUnique({
      where: { userId_packageId: { userId, packageId: pkg.id } },
      include: {
        elements: { select: { elementId: true, name: true, color: true, enabled: true, intervalDays: true } },
      },
    }),
    prisma.elementPreset.findMany({ orderBy: { name: "asc" } }),
  ]);

  const elements: ElementView[] = pkg.elements.map((e) => ({
    id: e.id,
    name: e.name,
    note: e.note,
    color: e.color,
    defaultIntervalDays: e.defaultIntervalDays,
    optional: e.optional,
  }));

  const existing: ExistingRow[] | null = subscription
    ? subscription.elements.map((e) => ({
        elementId: e.elementId,
        name: e.name,
        color: e.color,
        enabled: e.enabled,
        intervalDays: e.intervalDays,
      }))
    : null;

  const presets: PresetView[] = presetRows.map((p) => ({
    id: p.id,
    name: p.name,
    note: p.note,
    color: p.color,
    defaultIntervalDays: p.defaultIntervalDays,
  }));

  const cat = categoryLabel(pkg.category);

  return (
    <main className="min-h-dvh bg-gradient-to-b from-zinc-50 to-zinc-100/40">
      <AppHeader back={{ href: "/balicky", label: "Balíček" }} />

      <section className="mx-auto max-w-2xl px-6 py-12">
        {/* Hlavička balíčku */}
        <div className="flex items-start gap-4">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl"
            style={{ background: `${pkg.color}1a` }}
          >
            {pkg.icon ?? "📦"}
          </div>
          <div className="min-w-0 flex-1">
            {pkg.authorId === userId && (
              <Link
                href={`/balicky/${pkg.slug}/upravit`}
                className="float-right rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
              >
                Upravit
              </Link>
            )}
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">{pkg.title}</h1>
            {pkg.subtitle && <p className="mt-1 text-zinc-500">{pkg.subtitle}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              {cat && (
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-medium text-zinc-600">
                  {cat}
                </span>
              )}
              <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-medium text-zinc-600">
                {pkg.isFree ? "Zdarma" : "Placené"}
              </span>
              {pkg.author?.name && <span className="text-zinc-400">Autor: {pkg.author.name}</span>}
            </div>
          </div>
        </div>

        {pkg.description && (
          <p className="mt-6 whitespace-pre-line text-zinc-700">{pkg.description}</p>
        )}

        {pkg.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {pkg.tags.map((t) => (
              <span key={t} className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Odběr + přizpůsobení */}
        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6">
          {elements.length === 0 ? (
            <p className="text-sm text-zinc-400">Tento balíček zatím nemá žádné prvky.</p>
          ) : (
            <PackageSubscribe
              packageId={pkg.id}
              elements={elements}
              existing={existing}
              presets={presets}
            />
          )}
        </div>

        {subscription && (
          <p className="mt-4 text-center text-sm text-zinc-500">
            Naplánované události najdeš v{" "}
            <Link href="/kalendar" className="font-medium text-zinc-700 underline">
              kalendáři
            </Link>
            .
          </p>
        )}
      </section>
    </main>
  );
}
