import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";

// Servíruje uživatelův zvukový pokyn (MP3) z úložiště – jen jeho vlastníkovi.
export async function GET(req: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) return new Response("Neautorizováno", { status: 401 });

  const key = new URL(req.url).searchParams.get("key") ?? "";
  if (!key.startsWith("mycoach/sounds/") || key.includes("..")) {
    return new Response("Neplatný klíč", { status: 400 });
  }
  const owned = await prisma.userSound.findFirst({
    where: { userId: session.user.id, audioKey: key },
    select: { id: true },
  });
  if (!owned) return new Response("Nenalezeno", { status: 404 });

  try {
    const buf = await storage.read(key);
    return new Response(new Uint8Array(buf), {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, max-age=3600" },
    });
  } catch {
    return new Response("Nenalezeno", { status: 404 });
  }
}
