import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { logoutAction } from "@/lib/actions/auth";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <main className="min-h-dvh bg-zinc-50">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
        <span className="text-lg font-semibold tracking-tight text-zinc-900">MyCoach</span>
        <div className="flex items-center gap-4">
          <Link href="/profil" className="text-sm text-zinc-500 hover:text-zinc-900">
            {session.user.name ?? session.user.email}
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100">
              Odhlásit
            </button>
          </form>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Ahoj{session.user.name ? `, ${session.user.name}` : ""} 👋
        </h1>
        <p className="mt-2 text-zinc-600">
          Tohle je základ MyCoach. Příští kroky: evidence váhy a historie cvičení s grafy,
          výběr sportů a tréninkové plány.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Link
            href="/trening"
            className="group rounded-xl border border-zinc-900 bg-zinc-900 p-5 text-white transition hover:bg-zinc-800"
          >
            <h2 className="font-medium">Trénink ▶</h2>
            <p className="mt-1 text-sm text-zinc-300">Hlasově řízený intervalový trénink (Box)</p>
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-zinc-400 group-hover:text-zinc-200">
              Spustit
            </p>
          </Link>
          <Link
            href="/profil"
            className="group rounded-xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-400"
          >
            <h2 className="font-medium text-zinc-900">Profil</h2>
            <p className="mt-1 text-sm text-zinc-500">Výška, cíl a jednotky</p>
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-zinc-400 group-hover:text-zinc-600">
              Upravit
            </p>
          </Link>
          {[
            { title: "Moje míry", desc: "Váha a % tuku v čase" },
            { title: "Plány", desc: "Vyber sport a plán" },
          ].map((c) => (
            <div key={c.title} className="rounded-xl border border-zinc-200 bg-white p-5">
              <h2 className="font-medium text-zinc-900">{c.title}</h2>
              <p className="mt-1 text-sm text-zinc-500">{c.desc}</p>
              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-zinc-400">Brzy</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
