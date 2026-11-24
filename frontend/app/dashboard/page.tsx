"use client";
import { FormEvent, useEffect, useState } from "react";
import QrTicket from "@/components/QrTicket";
import { Button, Card, PageSkeleton, SectionHeader, StatusBadge, cx, inputCls } from "@/components/ui";
import { useRequireAuth } from "@/hooks/useAuth";
import { authApi, publicApi } from "@/services/auth";
import type { Announcement } from "@/types";

const BANNER = {
  pending: { icon: "⏳", title: "Application under review", text: "Your team is being reviewed. The decision will be emailed to every member's Gmail, and shown here — this page updates by itself.", cls: "border-gold/30 bg-gold/5" },
  accepted: { icon: "✅", title: "Your team is ACCEPTED", text: "Check-in: Tuesday 15 December 2026, 08:30, Central Library. Bring your laptop, charger, student ID and the QR ticket below.", cls: "border-emerald-400/50 bg-emerald-400/10" },
  rejected: { icon: "✖", title: "Application not retained", text: "Unfortunately your team was not retained this time. A message was sent to every member's Gmail.", cls: "border-rose/50 bg-rose/10" },
} as const;

export default function Dashboard() {
  const { user, refresh } = useRequireAuth();
  const [news, setNews] = useState<Announcement[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (user) publicApi.announcements().then(setNews).catch(() => {}); }, [user]);
  useEffect(() => { // pick up the organisers' decision without a manual reload
    const id = setInterval(() => { if (!document.hidden) refresh(); }, 30000);
    return () => clearInterval(id);
  }, [refresh]);

  if (!user) return <PageSkeleton />;
  const b = BANNER[user.status];
  const team = user.team;
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await authApi.setSubmission(String(new FormData(e.currentTarget).get("url")));
    await refresh(); setSaved(true);
  }

  return (
    <>
      <SectionHeader tag="DASHBOARD" title={`Welcome, ${user.name.split(" ")[0]}`} sub={team ? `Team “${team.name}”` : "Your mission control."} />
      <div className={cx("mb-4 flex items-start gap-4 rounded-[10px] border p-5", b.cls)}>
        <span className="text-3xl" aria-hidden>{b.icon}</span>
        <div><h3 className="font-bold">{b.title} <StatusBadge status={user.status} /></h3><p className="mt-1 text-sm text-[#b9b2a5]">{b.text}</p></div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="text-center">
          <p className="mb-3 text-sm text-[#b9b2a5]">Team ticket · show it at check-in</p>
          <QrTicket id={user.id} />
        </Card>
        <div className="grid content-start gap-4">
          <Card>
            <h3 className="mb-2 font-bold text-gold">Team members ({team ? team.member_emails.length + 1 : 1})</h3>
            <ul className="grid gap-1.5 text-sm">
              <li className="flex justify-between gap-2"><span>{user.name} <span className="text-muted">· {user.email}</span></span><span aria-label="leader">👑</span></li>
              {team?.member_emails.map((m) => <li key={m} className="text-[#b9b2a5]">{m}</li>)}
            </ul>
          </Card>
          <Card>
            <h3 className="mb-2 font-bold text-gold">Project submission</h3>
            <form onSubmit={save} className="grid gap-2">
              <input name="url" defaultValue={user.submission_url} placeholder="https://github.com/..." className={inputCls} />
              <Button small>{saved ? "Saved ✓" : "Save link"}</Button>
            </form>
          </Card>
        </div>
      </div>
      <Card className="mt-4">
        <h3 className="mb-2 font-bold text-gold">📢 Announcements</h3>
        <ul className="grid gap-2 text-sm">{news.map((a) => <li key={a.id}>{a.text} <span className="font-mono text-[11px] text-muted">{new Date(a.created_at).toLocaleDateString("en-GB")}</span></li>)}</ul>
      </Card>
    </>
  );
}
