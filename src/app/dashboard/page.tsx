import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logoutAction } from "@/lib/actions/auth";
import { Brand } from "@/components/brand";
import { Avatar } from "@/components/avatar";

export const metadata = { title: "Přehled" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, image: true },
  });
  const displayName = user?.name ?? user?.email ?? "";

  return (
    <main className="min-h-dvh bg-zinc-50">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white/80 px-6 py-4 backdrop-blur">
        <Brand />
        <div className="flex items-center gap-4">
          <Link
            href="/profil"
            className="group flex items-center gap-2.5 transition"
            title="Profil"
          >
            <span className="text-sm text-zinc-600 transition group-hover:text-zinc-900">
              {displayName}
            </span>
            <Avatar src={user?.image} name={displayName} size={36} />
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-100">
              Odhlásit
            </button>
          </form>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/trening"
            className="group flex flex-col rounded-2xl bg-zinc-900 p-6 text-white transition hover:bg-zinc-800"
          >
            <h2 className="text-lg font-medium">Trénink</h2>
            <p className="mt-1 text-sm text-zinc-300">Hlasově řízený intervalový trénink</p>
            <span className="mt-6 text-sm font-medium text-zinc-400 transition group-hover:text-white">
              Spustit →
            </span>
          </Link>

          <Link
            href="/kalendar"
            className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 transition hover:border-zinc-300 hover:shadow-sm"
          >
            <h2 className="text-lg font-medium text-zinc-900">Kalendář</h2>
            <p className="mt-1 text-sm text-zinc-500">Plánuj tréninky a úkoly</p>
            <span className="mt-6 text-sm font-medium text-zinc-400 transition group-hover:text-zinc-700">
              Otevřít →
            </span>
          </Link>

          <Link
            href="/treninky"
            className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 transition hover:border-zinc-300 hover:shadow-sm"
          >
            <h2 className="text-lg font-medium text-zinc-900">Moje tréninky</h2>
            <p className="mt-1 text-sm text-zinc-500">Skládej vlastní tréninky z bloků</p>
            <span className="mt-6 text-sm font-medium text-zinc-400 transition group-hover:text-zinc-700">
              Otevřít →
            </span>
          </Link>

          <Link
            href="/balicky"
            className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 transition hover:border-zinc-300 hover:shadow-sm"
          >
            <h2 className="text-lg font-medium text-zinc-900">Balíčky</h2>
            <p className="mt-1 text-sm text-zinc-500">Programy na míru → do kalendáře</p>
            <span className="mt-6 text-sm font-medium text-zinc-400 transition group-hover:text-zinc-700">
              Procházet →
            </span>
          </Link>
        </div>
      </section>
    </main>
  );
}
