"use client";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import QrTicket from "@/components/QrTicket";
import { Button, Card, PageSkeleton, SectionHeader, StatusBadge, inputCls } from "@/components/ui";
import { useRequireAuth } from "@/hooks/useAuth";
import { authApi, publicApi } from "@/services/auth";
import { teamsApi } from "@/services/teams";
import type { Announcement, Team } from "@/types";

const MSG = {
  pending: "Your application is under review.",
  accepted: "Access granted. See you at check-in!",
  rejected: "Unfortunately your application was not retained.",
};

export default function Dashboard() {
  const { user, refresh } = useRequireAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [news, setNews] = useState<Announcement[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    teamsApi.mine().then(setTeam).catch(() => {});
    publicApi.announcements().then(setNews).catch(() => {});
  }, [user]);

  if (!user) return <PageSkeleton />;
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await authApi.setSubmission(String(new FormData(e.currentTarget).get("url")));
    await refresh(); setSaved(true);
  }

  return (
    <>
      <SectionHeader tag="DASHBOARD" title={`Welcome, ${user.name.split(" ")[0]}`} sub="Your mission control." />
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="text-center">
          <StatusBadge status={user.status} />
          <p className="my-3 text-sm">{MSG[user.status]}</p>
          <QrTicket id={user.id} />
        </Card>
        <div className="grid content-start gap-4">
          <Card><h3 className="font-bold text-gold">Team</h3><p className="text-sm">{team ? `${team.name} · code ${team.code}` : "No team yet."} <Link href="/teams" className="text-gold">Manage →</Link></p></Card>
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
