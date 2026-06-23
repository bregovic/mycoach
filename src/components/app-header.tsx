import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Brand } from "./brand";
import { Avatar } from "./avatar";
import { logoutAction } from "@/lib/actions/auth";

// Sjednocená hlavička aplikace: značka vlevo (→ přehled), vpravo jméno + fotka
// (→ profil) a odhlášení. `back` přidá nenápadnou drobečkovou navigaci.
export async function AppHeader({ back }: { back?: { href: string; label: string } }) {
  const session = await auth();
  const userId = session?.user?.id;
  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true, image: true },
      })
    : null;
  const name = user?.name ?? user?.email ?? "";

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200/80 bg-white/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
        <div className="flex items-center gap-2.5">
          <Link href="/dashboard" className="transition hover:opacity-80">
            <Brand />
          </Link>
          {back && (
            <Link
              href={back.href}
              className="hidden items-center gap-2 text-sm text-zinc-400 transition hover:text-zinc-700 sm:flex"
            >
              <span className="text-zinc-300">/</span>
              {back.label}
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/profil" className="group flex items-center gap-2.5" title="Profil">
            <span className="hidden text-sm text-zinc-600 transition group-hover:text-zinc-900 sm:inline">
              {name}
            </span>
            <Avatar src={user?.image} name={name} size={34} />
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
            >
              Odhlásit
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
