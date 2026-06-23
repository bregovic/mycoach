import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";
import { createClub, acceptInvite, declineInvite, joinClub } from "@/lib/actions/clubs";

export const metadata = { title: "Oddíly" };

function ClubLogo({ url, size = 48 }: { url: string | null; size?: number }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element -- data URL
    return <img src={url} alt="" style={{ width: size, height: size }} className="shrink-0 rounded-xl object-cover ring-1 ring-zinc-200" />;
  }
  return (
    <span style={{ width: size, height: size }} className="flex shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-xl">
      👥
    </span>
  );
}

export default async function ClubsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;
  const email = (session.user.email ?? "").toLowerCase();
  const q = ((await searchParams).q ?? "").trim();

  const [memberships, invites] = await Promise.all([
    prisma.clubMember.findMany({
      where: { userId },
      include: { club: { include: { _count: { select: { members: true } } } } },
      orderBy: { joinedAt: "desc" },
    }),
    email
      ? prisma.clubInvite.findMany({
          where: { email, status: "pending" },
          include: { club: { select: { id: true, name: true, logoUrl: true } } },
        })
      : Promise.resolve([]),
  ]);

  const myClubIds = new Set(memberships.map((m) => m.clubId));
  const publicClubs = await prisma.club.findMany({
    where: {
      isPublic: true,
      id: { notIn: myClubIds.size ? [...myClubIds] : ["-"] },
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    },
    take: 20,
    include: { _count: { select: { members: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-dvh bg-gradient-to-b from-zinc-50 to-zinc-100/40">
      <AppHeader back={{ href: "/dashboard", label: "Oddíly" }} />

      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Oddíly</h1>
          <form action={createClub}>
            <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800">
              + Nový oddíl
            </button>
          </form>
        </div>

        {/* Pozvánky */}
        {invites.length > 0 && (
          <div className="mt-6 space-y-2">
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                <ClubLogo url={inv.club.logoUrl} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-zinc-700">
                    Pozvánka do oddílu <strong>{inv.club.name}</strong>
                    {inv.role === "trainer" ? " (jako trenér)" : ""}
                  </p>
                </div>
                <form action={acceptInvite.bind(null, inv.id)}>
                  <button className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-800">Přijmout</button>
                </form>
                <form action={declineInvite.bind(null, inv.id)}>
                  <button className="text-sm text-zinc-500 transition hover:text-zinc-800">Odmítnout</button>
                </form>
              </div>
            ))}
          </div>
        )}

        {/* Moje oddíly */}
        <h2 className="mt-8 text-sm font-medium uppercase tracking-wide text-zinc-400">Moje oddíly</h2>
        {memberships.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-400">
            Zatím nejsi v žádném oddílu. Vytvoř si vlastní, nebo se připoj k veřejnému.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {memberships.map((m) => (
              <li key={m.clubId}>
                <Link href={`/oddily/${m.clubId}`} className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 hover:shadow-sm">
                  <ClubLogo url={m.club.logoUrl} />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-medium text-zinc-900">{m.club.name}</h3>
                    <p className="mt-0.5 text-sm text-zinc-500">
                      {m.role === "owner" ? "Správce" : m.role === "trainer" ? "Trenér" : "Člen"} ·{" "}
                      {m.club._count.members} členů
                      {m.club.address ? ` · ${m.club.address}` : ""}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* Veřejné oddíly */}
        <div className="mt-12">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-400">Veřejné oddíly</h2>
          <form className="mt-3 flex gap-2" action="/oddily">
            <input name="q" defaultValue={q} placeholder="Hledat veřejný oddíl…" className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-zinc-500" />
            <button type="submit" className="shrink-0 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100">Hledat</button>
          </form>
          {publicClubs.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-400">
              {q ? "Nic nenalezeno." : "Zatím žádné veřejné oddíly."}
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {publicClubs.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4">
                  <ClubLogo url={c.logoUrl} />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-medium text-zinc-900">{c.name}</h3>
                    <p className="mt-0.5 text-sm text-zinc-500">
                      {c._count.members} členů{c.address ? ` · ${c.address}` : ""}
                    </p>
                  </div>
                  <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
                    <Link href={`/oddily/${c.id}`} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100">Detail</Link>
                    <form action={joinClub.bind(null, c.id)}>
                      <button className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800">Připojit se</button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
