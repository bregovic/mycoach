import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm, type ProfileValues } from "@/components/profile-form";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  });

  const values: ProfileValues = {
    heightCm: profile?.heightCm ?? null,
    birthYear: profile?.birthYear ?? null,
    sex: profile?.sex ?? null,
    goal: profile?.goal ?? null,
    unit: profile?.unit ?? "metric",
  };

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

      <section className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Profil</h1>
        <p className="mt-2 text-zinc-600">
          Základní údaje pro výpočty a personalizaci tréninku. Vše je nepovinné.
        </p>

        <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-6">
          <ProfileForm values={values} />
        </div>
      </section>
    </main>
  );
}
