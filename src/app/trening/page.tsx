import { redirect } from "next/navigation";
import { Teko, Barlow } from "next/font/google";
import { auth } from "@/auth";
import { Trainer } from "@/components/trainer/trainer";

const teko = Teko({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  variable: "--font-teko",
});
const barlow = Barlow({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700"],
  variable: "--font-barlow",
});

export default async function TreningPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userName = session.user.name ?? session.user.email ?? "sportovče";
  return (
    <div className={`${teko.variable} ${barlow.variable}`}>
      <Trainer userName={userName} />
    </div>
  );
}
