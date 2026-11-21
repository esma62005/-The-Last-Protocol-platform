"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
import CountUp from "@/components/CountUp";
import { Button, Card, HBar, PageSkeleton, SectionHeader, StatusBadge, inputCls } from "@/components/ui";
import { useRequireAuth } from "@/hooks/useAuth";
import { adminApi } from "@/services/admin";
import { publicApi } from "@/services/auth";
import type { AdminStats, AdminTeam, Announcement, Status, User } from "@/types";

export default function AdminPage() {
  const { user } = useRequireAuth("admin");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [news, setNews] = useState<Announcement[]>([]);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");

  const loadStatic = useCallback(async () => {
    try {
      const [s, t, n] = await Promise.all([adminApi.stats(), adminApi.teams(), publicApi.announcements()]);
      setStats(s); setTeams(t); setNews(n);
    } catch (x) { setErr((x as Error).message); }
  }, []);
  const loadUsers = useCallback(() => adminApi.users(filter, q).then(setUsers).catch((x) => setErr(x.message)), [filter, q]);

  useEffect(() => { if (user?.role === "admin") loadStatic(); }, [user, loadStatic]);
  useEffect(() => { if (user?.role === "admin") loadUsers(); }, [user, loadUsers]);

  if (user?.role !== "admin" || !stats) return err ? <p className="text-rose">⚠ {err}</p> : <PageSkeleton />;

  const review = async (id: string, s: Status) => { await adminApi.setStatus(id, s); await Promise.all([loadUsers(), loadStatic()]); };
  const field = (e: FormEvent, k: string) => String(new FormData(e.currentTarget as HTMLFormElement).get(k));
  const addNews = async (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const form = e.currentTarget; await adminApi.addAnnouncement(field(e, "t")); form.reset(); loadStatic(); };
  const setCap = async (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); setStats(await adminApi.setCapacity(Number(field(e, "c")))); };

  const cards: [string, number][] = [["Total", stats.total], ["Accepted", stats.accepted], ["Pending", stats.pending], ["Rejected", stats.rejected], ["Seats left", stats.seats_left]];
  const th = "px-3 py-2 text-left text-[11px] text-gold";

  return (
    <>
      <SectionHeader tag="ADMIN" title="Command center" sub="Manage, approve and analyze." />
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
        {cards.map(([l, v]) => <Card key={l}><div className="font-mono text-4xl font-bold text-gold"><CountUp to={v} /></div><p className="text-sm text-[#b9b2a5]">{l}</p></Card>)}
      </div>

      <div className="my-4 grid gap-4 md:grid-cols-2">
        <Card><h3 className="font-bold text-gold">By status</h3>
          <HBar label="Accepted" value={stats.accepted} max={stats.total} /><HBar label="Pending" value={stats.pending} max={stats.total} /><HBar label="Rejected" value={stats.rejected} max={stats.total} /></Card>
        <Card><h3 className="font-bold text-gold">By track</h3>{Object.entries(stats.by_track).map(([k, v]) => <HBar key={k} label={k} value={v} max={stats.total} />)}</Card>
      </div>

      <Card className="overflow-hidden">
        <div className="mb-3 flex flex-wrap gap-2">
          <input className={`${inputCls} max-w-[220px]`} placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} />
          <select className={`${inputCls} max-w-[150px]`} value={filter} onChange={(e) => setFilter(e.target.value)}>{["all", "pending", "accepted", "rejected"].map((x) => <option key={x}>{x}</option>)}</select>
          <Button small onClick={() => adminApi.downloadCsv()}>Export CSV</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full font-mono text-xs">
            <thead><tr className="border-b border-gold/20">{["NAME", "EMAIL", "UNIVERSITY", "TRACK", "STATUS", "ACTION"].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gold/10 transition-colors hover:bg-gold/5">
                  <td className="px-3 py-2">{u.name}</td><td className="px-3 py-2">{u.email}</td><td className="px-3 py-2">{u.university}</td><td className="px-3 py-2">{u.track}</td>
                  <td className="px-3 py-2"><StatusBadge status={u.status} /></td>
                  <td className="whitespace-nowrap px-3 py-2"><Button small variant="ok" onClick={() => review(u.id, "accepted")}>✓</Button> <Button small variant="danger" onClick={() => review(u.id, "rejected")}>✗</Button></td>
                </tr>
              ))}
              {!users.length && <tr><td colSpan={6} className="px-3 py-6 text-center text-muted">No participants found.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card><h3 className="mb-2 font-bold text-gold">Teams ({stats.teams})</h3>
          <ul className="grid gap-1 text-sm">{teams.map((t) => <li key={t.id}>{t.name} · {t.size}/5 · <span className="font-mono text-gold">{t.code}</span> <span className="text-muted">({t.lead_name ?? "—"})</span></li>)}{!teams.length && <li className="text-muted">No teams yet</li>}</ul></Card>
        <Card>
          <h3 className="mb-2 font-bold text-gold">Announcement</h3>
          <form onSubmit={addNews} className="grid gap-2"><input name="t" required placeholder="Message to all participants" className={inputCls} /><Button small>Send</Button></form>
          <ul className="mt-3 grid gap-1 text-sm">{news.map((a) => <li key={a.id} className="flex justify-between gap-2">{a.text}<button className="text-rose" onClick={async () => { await adminApi.deleteAnnouncement(a.id); loadStatic(); }}>✕</button></li>)}</ul>
          <h3 className="mb-2 mt-5 font-bold text-gold">Seats</h3>
          <form onSubmit={setCap} className="flex gap-2"><input name="c" type="number" min={1} defaultValue={stats.capacity} className={inputCls} /><Button small>Set</Button></form>
        </Card>
      </div>
    </>
  );
}
