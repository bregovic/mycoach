import { auth } from "@/auth";
import { storage } from "@/lib/storage";

// Servíruje MP3 instrukci ke cviku z úložiště (R2) přihlášenému uživateli.
// Klíče jsou omezené na prefix mycoach/exercise-audio/ (žádné cizí soubory).
export async function GET(req: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) return new Response("Neautorizováno", { status: 401 });

  const key = new URL(req.url).searchParams.get("key") ?? "";
  if (!key.startsWith("mycoach/exercise-audio/") || key.includes("..")) {
    return new Response("Neplatný klíč", { status: 400 });
  }
  try {
    const buf = await storage.read(key);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new Response("Nenalezeno", { status: 404 });
  }
}
