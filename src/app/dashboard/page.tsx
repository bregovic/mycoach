import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { logoutAction } from "@/lib/actions/auth";
import { Brand } from "@/components/brand";

export const metadata = { title: "Přehled" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <main className="min-h-dvh bg-zinc-50">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white/80 px-6 py-4 backdrop-blur">
        <Brand />
        <div className="flex items-center gap-4">
          <Link href="/profil" className="text-sm text-zinc-500 transition hover:text-zinc-900">
            {session.user.name ?? session.user.email}
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-100">
              Odhlásit
            </button>
          </form>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Ahoj{session.user.name ? `, ${session.user.name}` : ""} 👋
        </h1>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
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
            href="/profil"
            className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 transition hover:border-zinc-300 hover:shadow-sm"
          >
            <h2 className="text-lg font-medium text-zinc-900">Profil</h2>
            <p className="mt-1 text-sm text-zinc-500">Váha, BMI a osobní údaje</p>
            <span className="mt-6 text-sm font-medium text-zinc-400 transition group-hover:text-zinc-700">
              Otevřít →
            </span>
          </Link>

          <div className="flex flex-col rounded-2xl border border-dashed border-zinc-200 bg-white/50 p-6">
            <h2 className="text-lg font-medium text-zinc-400">Plány</h2>
            <p className="mt-1 text-sm text-zinc-400">Sporty a tréninkové plány</p>
            <span className="mt-6 text-xs font-medium uppercase tracking-wide text-zinc-300">Brzy</span>
          </div>
        </div>
      </section>
    </main>
  );
}
