"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { WEEKDAYS, keyToDate } from "@/lib/calendar";
import { minToHHMM, STATUS_LABEL, STATUS_TONE, type SessionStatus } from "@/lib/clubs";
import { ImageUpload } from "@/components/image-upload";
import {
  acceptInvite,
  addScheduleRule,
  assignTraining,
  cancelInvite,
  cancelSession,
  confirmSession,
  deleteClub,
  deleteScheduleRule,
  inviteMember,
  joinClub,
  leaveClub,
  removeMember,
  setAttendance,
  setMemberRole,
  updateClubLogo,
  updateClubMeta,
} from "@/lib/actions/clubs";

export interface ClubDTO {
  id: string;
  name: string;
  logoUrl: string | null;
  address: string | null;
  sportSlug: string | null;
  isPublic: boolean;
  myRole: string | null;
  rules: { id: string; weekdays: number[]; startMin: number; endMin: number }[];
  members: { userId: string; name: string; role: string }[];
  invites: { id: string; email: string; role: string }[];
  sessions: {
    id: string;
    dateKey: string;
    startMin: number;
    endMin: number;
    status: SessionStatus;
    goingCount: number;
    myStatus: string | null; // going | excused | null
    trainingId: string | null;
    trainingTitle: string | null;
    attendees: { name: string; status: "going" | "excused" }[];
  }[];
  trainings: { id: string; title: string }[];
}

const input = "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500";
const dateFmt = new Intl.DateTimeFormat("cs-CZ", { weekday: "short", day: "numeric", month: "numeric" });

function ruleText(weekdays: number[], startMin: number, endMin: number): string {
  const days = WEEKDAYS.filter((w) => weekdays.includes(w.value)).map((w) => w.short).join(", ");
  return `${days} · ${minToHHMM(startMin)}–${minToHHMM(endMin)}`;
}

export function ClubView({ club }: { club: ClubDTO }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      await fn();
      router.refresh();
    });

  const isOwner = club.myRole === "owner";
  const isTrainer = club.myRole === "owner" || club.myRole === "trainer";
  const isMember = club.myRole != null;
  const [days, setDays] = useState<Set<number>>(new Set());

  return (
    <div className={pending ? "pointer-events-none opacity-60" : ""}>
      {/* Hlavička */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row">
          {isOwner ? (
            <ImageUpload
              url={club.logoUrl}
              disabled={pending}
              onPick={(d) => run(() => updateClubLogo(club.id, d))}
              onClear={() => run(() => updateClubLogo(club.id, null))}
            />
          ) : club.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- data URL
            <img src={club.logoUrl} alt="" className="h-24 w-24 shrink-0 rounded-xl object-cover ring-1 ring-zinc-200" />
          ) : (
            <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-3xl">👥</span>
          )}

          {isOwner ? (
            <form
              onSubmit={(e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                run(() =>
                  updateClubMeta({
                    id: club.id,
                    name: String(fd.get("name") ?? ""),
                    address: String(fd.get("address") ?? ""),
                    isPublic: fd.get("isPublic") === "on",
                  }),
                );
              }}
              className="flex-1 space-y-3"
            >
              <input name="name" defaultValue={club.name} placeholder="Název oddílu" className={`${input} w-full text-lg font-medium`} />
              <input name="address" defaultValue={club.address ?? ""} placeholder="Adresa tělocvičny" className={`${input} w-full`} />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-zinc-700">
                  <input type="checkbox" name="isPublic" defaultChecked={club.isPublic} className="h-4 w-4 rounded border-zinc-300 accent-zinc-900" />
                  Veřejně dohledatelný
                </label>
                <button type="submit" className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100">Uložit</button>
              </div>
            </form>
          ) : (
            <div className="flex-1">
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{club.name}</h1>
              {club.address && <p className="mt-1 text-sm text-zinc-500">📍 {club.address}</p>}
              <p className="mt-2 text-sm text-zinc-500">{club.members.length} členů</p>
              {!isMember && club.isPublic && (
                <form action={joinClub.bind(null, club.id)} className="mt-3">
                  <button className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800">Připojit se</button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Rozvrh */}
      <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="text-base font-semibold text-zinc-900">Rozvrh tréninků</h2>
        <div className="mt-3 space-y-2">
          {club.rules.length === 0 && <p className="text-sm text-zinc-400">Zatím žádný rozvrh.</p>}
          {club.rules.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm">
              <span className="font-medium text-zinc-800">{ruleText(r.weekdays, r.startMin, r.endMin)}</span>
              {isOwner && (
                <button type="button" onClick={() => run(() => deleteScheduleRule(r.id))} className="text-zinc-400 hover:text-red-600" aria-label="Smazat">×</button>
              )}
            </div>
          ))}
        </div>
        {isOwner && (
          <form
            onSubmit={(e: FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              run(() => addScheduleRule({ clubId: club.id, weekdays: [...days], start: String(fd.get("start") ?? ""), end: String(fd.get("end") ?? "") }));
              setDays(new Set());
              e.currentTarget.reset();
            }}
            className="mt-4 space-y-3 border-t border-zinc-100 pt-4"
          >
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map((w) => (
                <button
                  key={w.value}
                  type="button"
                  onClick={() => setDays((p) => { const n = new Set(p); n.has(w.value) ? n.delete(w.value) : n.add(w.value); return n; })}
                  className={`h-9 w-10 rounded-lg border text-sm font-medium transition ${days.has(w.value) ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 text-zinc-600 hover:bg-zinc-50"}`}
                >
                  {w.short}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input name="start" type="time" defaultValue="07:00" className={input} />
              <span className="text-zinc-400">–</span>
              <input name="end" type="time" defaultValue="08:00" className={input} />
              <button type="submit" disabled={days.size === 0} className="ml-auto rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-40">Přidat</button>
            </div>
          </form>
        )}
      </div>

      {/* Termíny */}
      <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="text-base font-semibold text-zinc-900">Nejbližší termíny</h2>
        <div className="mt-3 space-y-2">
          {club.sessions.length === 0 && <p className="text-sm text-zinc-400">Žádné nadcházející termíny (přidej rozvrh).</p>}
          {club.sessions.map((s) => (
            <div key={s.id} className="rounded-xl border border-zinc-200 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-medium capitalize text-zinc-900">{dateFmt.format(keyToDate(s.dateKey))}</span>
                  <span className="ml-2 text-sm text-zinc-500">{minToHHMM(s.startMin)}–{minToHHMM(s.endMin)}</span>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_TONE[s.status]}`}>{STATUS_LABEL[s.status]}</span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500">
                <span>{s.goingCount} přijde</span>
                {s.trainingTitle && <span>· 🥊 {s.trainingTitle}</span>}
              </div>

              {/* Přehled kdo přijde / kdo se omluvil */}
              {s.attendees.length > 0 && (
                <div className="mt-2 space-y-0.5 text-xs">
                  {s.attendees.some((a) => a.status === "going") && (
                    <p className="text-zinc-500">
                      <span className="font-medium text-green-700">Přijde:</span>{" "}
                      {s.attendees.filter((a) => a.status === "going").map((a) => a.name).join(", ")}
                    </p>
                  )}
                  {s.attendees.some((a) => a.status === "excused") && (
                    <p className="text-zinc-500">
                      <span className="font-medium text-red-700">Omluveni:</span>{" "}
                      {s.attendees.filter((a) => a.status === "excused").map((a) => a.name).join(", ")}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {isMember && (
                  <>
                    <button
                      type="button"
                      onClick={() => run(() => setAttendance(s.id, "going"))}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${s.myStatus === "going" ? "bg-green-600 text-white hover:bg-green-700" : "border border-zinc-300 text-zinc-700 hover:bg-zinc-100"}`}
                    >
                      {s.myStatus === "going" ? "✓ Přijdu" : "Přijdu"}
                    </button>
                    <button
                      type="button"
                      onClick={() => run(() => setAttendance(s.id, "excused"))}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${s.myStatus === "excused" ? "bg-red-600 text-white hover:bg-red-700" : "border border-red-300 text-red-600 hover:bg-red-50"}`}
                    >
                      {s.myStatus === "excused" ? "✓ Omluveno" : "Omluvit se"}
                    </button>
                  </>
                )}
                {isTrainer && (
                  <>
                    <select
                      value={s.trainingId ?? ""}
                      onChange={(e) => run(() => assignTraining(s.id, e.target.value || null))}
                      className={`${input} max-w-[12rem]`}
                    >
                      <option value="">— bez tréninku —</option>
                      {club.trainings.map((t) => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => run(() => confirmSession(s.id, s.status !== "confirmed"))}
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                    >
                      {s.status === "confirmed" ? "Zrušit potvrzení" : "Potvrdit"}
                    </button>
                    <button
                      type="button"
                      onClick={() => run(() => cancelSession(s.id, s.status !== "cancelled"))}
                      className="text-sm text-red-600 transition hover:text-red-700"
                    >
                      {s.status === "cancelled" ? "Obnovit" : "Zrušit"}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Členové */}
      <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="text-base font-semibold text-zinc-900">Členové ({club.members.length})</h2>
        <ul className="mt-3 space-y-2">
          {club.members.map((m) => (
            <li key={m.userId} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-zinc-800">
                {m.name}
                <span className="ml-2 text-xs text-zinc-400">{m.role === "owner" ? "Správce" : m.role === "trainer" ? "Trenér" : "Člen"}</span>
              </span>
              {isOwner && m.role !== "owner" && (
                <span className="flex items-center gap-2">
                  <select value={m.role} onChange={(e) => run(() => setMemberRole(club.id, m.userId, e.target.value))} className="rounded-lg border border-zinc-300 px-2 py-1 text-xs">
                    <option value="member">Člen</option>
                    <option value="trainer">Trenér</option>
                  </select>
                  <button type="button" onClick={() => run(() => removeMember(club.id, m.userId))} className="text-zinc-400 hover:text-red-600" aria-label="Odebrat">×</button>
                </span>
              )}
            </li>
          ))}
        </ul>

        {/* Pozvánky */}
        {isOwner && (
          <div className="mt-4 border-t border-zinc-100 pt-4">
            <form
              onSubmit={(e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const email = String(fd.get("email") ?? "").trim();
                if (!email) return;
                run(() => inviteMember(club.id, email, String(fd.get("role") ?? "member")));
                e.currentTarget.reset();
              }}
              className="flex flex-wrap gap-2"
            >
              <input name="email" type="email" placeholder="E-mail pro pozvánku…" className={`${input} min-w-[10rem] flex-1`} />
              <select name="role" defaultValue="member" className={input}>
                <option value="member">jako člen</option>
                <option value="trainer">jako trenér</option>
              </select>
              <button type="submit" className="shrink-0 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800">Pozvat</button>
            </form>
            {club.invites.length > 0 && (
              <ul className="mt-3 space-y-1">
                {club.invites.map((inv) => (
                  <li key={inv.id} className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-1.5 text-sm">
                    <span className="text-zinc-600">{inv.email} · {inv.role === "trainer" ? "trenér" : "člen"} · čeká</span>
                    <button type="button" onClick={() => run(() => cancelInvite(inv.id))} className="text-zinc-400 hover:text-red-600" aria-label="Zrušit pozvánku">×</button>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-xs text-zinc-400">Pozvánka se pozvanému objeví v aplikaci (odeslání e-mailu zatím neřešíme).</p>
          </div>
        )}
      </div>

      {/* Spodní akce */}
      <div className="mt-6 flex items-center justify-between border-t border-zinc-200 pt-5">
        {isMember && !isOwner && (
          <button type="button" onClick={() => run(() => leaveClub(club.id))} className="text-sm text-zinc-500 transition hover:text-zinc-800">Opustit oddíl</button>
        )}
        {isOwner && (
          <button
            type="button"
            onClick={() => { if (confirm("Opravdu smazat oddíl?")) run(() => deleteClub(club.id)); }}
            className="text-sm text-red-600 transition hover:text-red-700"
          >
            Smazat oddíl
          </button>
        )}
        <Link href="/oddily" className="ml-auto text-sm text-zinc-400 transition hover:text-zinc-700">← Všechny oddíly</Link>
      </div>
    </div>
  );
}
