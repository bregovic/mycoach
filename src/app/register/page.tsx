import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { registerAction } from "@/lib/actions/auth";
import { AuthForm } from "@/components/auth-form";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");
  return (
    <main className="flex min-h-dvh items-center justify-center bg-zinc-50 px-4 py-12">
      <AuthForm mode="register" action={registerAction} />
    </main>
  );
}
