"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
import CountUp from "@/components/CountUp";
import QrScanner from "@/components/QrScanner";
import { Button, Card, HBar, PageSkeleton, SectionHeader, StatusBadge, cx, inputCls } from "@/components/ui";
import { useRequireAuth } from "@/hooks/useAuth";
import { adminApi } from "@/services/admin";
import { publicApi } from "@/services/auth";
import type { AdminAccount, AdminStats, AdminTeam, Announcement, CheckIn, OutboxStats, Status, User } from "@/types";

export default function AdminPage() {
  const { user } = useRequireAuth("admin");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [news, setNews] = useState<Announcement[]>([]);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");
  const [flash, setFlash] = useState("");
  const [problem, setProblem] = useState("");
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [outbox, setOutbox] = useState<OutboxStats | null>(null);
  const [scan, setScan] = useState<CheckIn | null>(null);
  const [scanErr, setScanErr] = useState("");

  const loadStatic = useCallback(async () => {
    try {
      const [s, t, n, a, o] = await Promise.all([adminApi.stats(), adminApi.teams(), publicApi.announcements(), adminApi.admins(), adminApi.outbox()]);
      setStats(s); setTeams(t); setNews(n); setAdmins(a); setOutbox(o);
    } catch (x) { setErr((x as Error).message); }
  }, []);
  const checkIn = useCallback(async (code: string) => {
    try { setScan(await adminApi.checkIn(code)); setScanErr(""); loadStatic(); }
    catch (x) { setScan(null); setScanErr((x as Error).message); }
  }, [loadStatic]);
  const loadUsers = useCallback(() => adminApi.users(filter, q).then(setUsers).catch((x) => setErr(x.message)), [filter, q]);

  useEffect(() => { if (user?.role === "admin") loadStatic(); }, [user, loadStatic]);
  useEffect(() => { if (user?.role === "admin") loadUsers(); }, [user, loadUsers]);

  if (user?.role !== "admin" || !stats) return err ? <p className="text-rose">⚠ {err}</p> : <PageSkeleton />;

  const review = async (u: User, s: Status) => {
    const done = await adminApi.setStatus(u.id, s);
    await Promise.all([loadUsers(), loadStatic()]);
    const n = 1 + (done.team?.member_emails.length ?? 0);
    setFlash(done.status === "pending" || u.status === s ? `Status of “${done.team?.name ?? done.name}” updated.` : `“${done.team?.name ?? done.name}” is ${s}. E-mail queued for ${n} address${n > 1 ? "es" : ""}.`);
  };
  const field = (e: FormEvent, k: string) => String(new FormData(e.currentTarget as HTMLFormElement).get(k));
  const addNews = async (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const form = e.currentTarget; await adminApi.addAnnouncement(field(e, "t")); form.reset(); loadStatic(); };
  const setCap = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setProblem("");
    try { setStats(await adminApi.setCapacity(Number(field(e, "c")))); setFlash("Capacity updated."); }
    catch (x) { setProblem((x as Error).message); }
  };
  const addAdmin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setProblem("");
    const form = e.currentTarget;
    try { await adminApi.addAdmin(field(e, "n"), field(e, "e"), field(e, "p")); form.reset(); setFlash("Admin added."); loadStatic(); }
    catch (x) { setProblem((x as Error).message); }
  };
  const removeAdmin = async (a: AdminAccount) => {
    if (!confirm(`Remove admin ${a.email}?`)) return;
    setProblem("");
    try { await adminApi.removeAdmin(a.id); loadStatic(); } catch (x) { setProblem((x as Error).message); }
  };
  const manualCheckIn = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const f = e.currentTarget; checkIn(field(e, "code")); f.reset(); };

  const cards: [string, number][] = [["Teams", stats.total], ["Participants", stats.participants], ["Accepted", stats.accepted], ["Pending", stats.pending], ["Rejected", stats.rejected], ["Seats left", stats.seats_left], ["Checked in", stats.checked_in]];
  const th = "px-3 py-2 text-left text-[11px] text-gold";

  return (
    <>
      <SectionHeader tag="ADMIN" title="Command center" sub="Manage, approve and analyze." />
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
        {cards.map(([l, v]) => <Card key={l}><div className="font-mono text-4xl font-bold text-gold"><CountUp to={v} /></div><p className="text-sm text-[#b9b2a5]">{l}</p></Card>)}
      </div>

      <div className="my-4 grid gap-4 md:grid-cols-2">
        <Card><h3 className="font-bold text-gold">Teams by status</h3>
          <HBar label="Accepted" value={stats.accepted} max={stats.total} /><HBar label="Pending" value={stats.pending} max={stats.total} /><HBar label="Rejected" value={stats.rejected} max={stats.total} /></Card>
        <Card><h3 className="font-bold text-gold">Team size</h3>{Object.entries(stats.by_size).map(([k, v]) => <HBar key={k} label={`${k} members`} value={v} max={stats.total} />)}</Card>
      </div>

      {problem && <p className="mb-4 rounded border border-rose/40 bg-rose/10 px-3 py-2 text-sm text-rose">⚠ {problem}</p>}

      <Card className="mb-4">
        <h3 className="mb-3 font-bold text-gold">📷 Event-day check-in</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <QrScanner onScan={checkIn} />
          <div className="grid content-start gap-3">
            <form onSubmit={manualCheckIn} className="flex gap-2">
              <input name="code" required placeholder="Ticket code (TLP-XXXXXX)" className={`${inputCls} font-mono uppercase`} />
              <Button small>Check in</Button>
            </form>
            {scanErr && <p className="rounded border border-rose/50 bg-rose/10 p-3 text-sm text-rose">✖ {scanErr}</p>}
            {scan && (
              <div className={cx("rounded border p-3 text-sm", scan.already_checked_in ? "border-gold/50 bg-gold/10" : "border-emerald-400/50 bg-emerald-400/10")}>
                <p className="font-bold">{scan.already_checked_in ? "⚠ Already checked in" : "✅ Welcome!"} · {scan.team_name}</p>
                <p className="text-[#b9b2a5]">{scan.size} members · leader {scan.leader_name} · ticket {scan.ticket}</p>
                <p className="font-mono text-xs text-muted">{new Date(scan.checked_in_at).toLocaleString("en-GB")}</p>
                <ul className="mt-1 text-xs text-muted">{scan.member_emails.map((m) => <li key={m}>{m}</li>)}</ul>
                <button className="mt-2 text-xs text-rose underline" onClick={async () => { await adminApi.undoCheckIn(scan.ticket); setScan(null); loadStatic(); }}>Undo check-in</button>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {flash && <p className="mb-3 rounded border border-gold/30 bg-gold/5 px-3 py-2 text-sm text-gold">✉ {flash}</p>}
        <div className="mb-3 flex flex-wrap gap-2">
          <input className={`${inputCls} max-w-[220px]`} placeholder="Search team, name, email..." value={q} onChange={(e) => setQ(e.target.value)} />
          <select className={`${inputCls} max-w-[150px]`} value={filter} onChange={(e) => setFilter(e.target.value)}>{["all", "pending", "accepted", "rejected"].map((x) => <option key={x}>{x}</option>)}</select>
          <Button small onClick={() => adminApi.downloadCsv()}>Export CSV</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full font-mono text-xs">
            <thead><tr className="border-b border-gold/20">{["TEAM", "LEADER", "MEMBERS (GMAIL)", "UNIVERSITY", "STATUS", "ACTION"].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gold/10 transition-colors hover:bg-gold/5">
                  <td className="px-3 py-2 font-bold text-gold">{u.team?.name ?? "—"}</td><td className="px-3 py-2">{u.name}<br /><span className="text-muted">{u.email}</span></td><td className="px-3 py-2 text-muted">{u.team?.member_emails.map((m) => <div key={m}>{m}</div>)}</td><td className="px-3 py-2">{u.university}</td>
                  <td className="px-3 py-2"><StatusBadge status={u.status} /></td>
                  <td className="whitespace-nowrap px-3 py-2"><Button small variant="ok" onClick={() => review(u, "accepted")}>✓</Button> <Button small variant="danger" onClick={() => review(u, "rejected")}>✗</Button></td>
                </tr>
              ))}
              {!users.length && <tr><td colSpan={6} className="px-3 py-6 text-center text-muted">No participants found.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card><h3 className="mb-2 font-bold text-gold">Teams ({stats.teams})</h3>
          <ul className="grid gap-1 text-sm">{teams.map((t) => <li key={t.id}><b className="text-gold">{t.name}</b> · {t.size}/5 <span className="text-muted">(leader: {t.lead_name ?? "—"})</span></li>)}{!teams.length && <li className="text-muted">No teams yet</li>}</ul></Card>
        <Card>
          <h3 className="mb-2 font-bold text-gold">Announcement</h3>
          <form onSubmit={addNews} className="grid gap-2"><input name="t" required placeholder="Message to all participants" className={inputCls} /><Button small>Send</Button></form>
          <ul className="mt-3 grid gap-1 text-sm">{news.map((a) => <li key={a.id} className="flex justify-between gap-2">{a.text}<button className="text-rose" onClick={async () => { await adminApi.deleteAnnouncement(a.id); loadStatic(); }}>✕</button></li>)}</ul>
          <h3 className="mb-2 mt-5 font-bold text-gold">Team capacity</h3>
          <form onSubmit={setCap} className="flex gap-2"><input name="c" type="number" min={1} defaultValue={stats.capacity} className={inputCls} /><Button small>Set</Button></form>
          <p className="mt-1 text-xs text-muted">Cannot be lower than the {stats.total - stats.rejected} teams currently registered.</p>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card>
          <h3 className="mb-2 font-bold text-gold">Admins ({admins.length})</h3>
          <ul className="mb-3 grid gap-1 text-sm">
            {admins.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2">
                <span>{a.name} <span className="text-muted">· {a.email}</span></span>
                {a.id !== user?.id && a.id !== "TLP-ADMIN" && <button className="text-rose" aria-label={`Remove ${a.email}`} onClick={() => removeAdmin(a)}>✕</button>}
              </li>
            ))}
          </ul>
          <form onSubmit={addAdmin} className="grid gap-2">
            <input name="n" required minLength={2} placeholder="Full name" className={inputCls} />
            <input name="e" type="email" required placeholder="Email" className={inputCls} />
            <input name="p" type="password" required minLength={12} maxLength={72} autoComplete="new-password" placeholder="Password (12+ characters)" className={inputCls} />
            <Button small>Add admin</Button>
          </form>
        </Card>
        <Card>
          <h3 className="mb-2 font-bold text-gold">E-mail queue</h3>
          {outbox && (
            <>
              <p className="font-mono text-sm">pending <b>{outbox.pending}</b> · sent <b>{outbox.sent}</b> · failed <b className={outbox.failed ? "text-rose" : ""}>{outbox.failed}</b></p>
              <p className="mt-1 text-xs text-muted">Each member receives a private message. Failed messages are retried automatically with back-off.</p>
              {outbox.failed > 0 && <Button small className="mt-3" onClick={async () => setOutbox(await adminApi.retryOutbox())}>Retry failed</Button>}
            </>
          )}
        </Card>
      </div>
    </>
  );
}
