import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Brand } from "@/components/brand";
import { PackageEditor, type PackageDTO } from "@/components/packages/package-editor";

export const metadata = { title: "Úprava balíčku" };

export default async function PackageEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { slug } = await params;
  const pkg = await prisma.package.findFirst({
    where: { slug, authorId: session.user.id },
    include: { elements: { orderBy: { order: "asc" } } },
  });
  if (!pkg) notFound();

  const dto: PackageDTO = {
    id: pkg.id,
    slug: pkg.slug,
    title: pkg.title,
    subtitle: pkg.subtitle,
    description: pkg.description,
    category: pkg.category,
    tags: pkg.tags,
    icon: pkg.icon,
    color: pkg.color,
    isFree: pkg.isFree,
    priceCents: pkg.priceCents,
    published: pkg.published,
    elements: pkg.elements.map((e) => ({
      id: e.id,
      name: e.name,
      note: e.note,
      color: e.color,
      defaultIntervalDays: e.defaultIntervalDays,
      optional: e.optional,
    })),
  };

  return (
    <main className="min-h-dvh bg-zinc-50">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white/80 px-6 py-4 backdrop-blur">
        <Link href="/dashboard">
          <Brand />
        </Link>
        <Link href="/balicky" className="text-sm text-zinc-500 transition hover:text-zinc-900">
          ← Balíčky
        </Link>
      </header>

      <section className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Úprava balíčku</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Tohle je šablona — upravit ji můžeš jen ty jako autor. Odběratelé si dělají vlastní kopii.
        </p>
        <div className="mt-6">
          <PackageEditor pkg={dto} />
        </div>
      </section>
    </main>
  );
}
