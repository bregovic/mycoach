// Pomocné funkce pro oddíly (bez DB): čas, stav termínu.
export function minToHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function hhmmToMin(v: string): number | null {
  const m = v.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export type SessionStatus = "cancelled" | "confirmed" | "planned";

/** Stav termínu: bez účastníků (a ne ručně potvrzeno) = zrušeno. */
export function sessionStatus(
  s: { trainerConfirmed: boolean; canceled: boolean },
  attendeeCount: number,
): SessionStatus {
  if (s.canceled) return "cancelled";
  if (attendeeCount === 0) return "cancelled"; // nikdo nedorazí → zrušeno
  if (s.trainerConfirmed) return "confirmed";
  return "planned";
}

export const STATUS_LABEL: Record<SessionStatus, string> = {
  cancelled: "Zrušeno",
  confirmed: "Potvrzeno",
  planned: "Naplánováno",
};

export const STATUS_TONE: Record<SessionStatus, string> = {
  cancelled: "bg-red-50 text-red-700",
  confirmed: "bg-green-50 text-green-700",
  planned: "bg-amber-50 text-amber-700",
};
