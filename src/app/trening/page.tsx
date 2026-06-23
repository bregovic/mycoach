import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Trainer } from "@/components/trainer/trainer";
import { getUserCues } from "@/lib/sounds-server";

export default async function TreningPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userName = session.user.name ?? session.user.email ?? "sportovče";
  const cues = await getUserCues(session.user.id);
  return <Trainer userName={userName} cues={cues} />;
}
