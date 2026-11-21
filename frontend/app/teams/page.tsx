"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Button, Card, Field, PageSkeleton, SectionHeader, StatusBadge, inputCls } from "@/components/ui";
import { useRequireAuth } from "@/hooks/useAuth";
import { teamsApi } from "@/services/teams";
import type { Team } from "@/types";

export default function TeamsPage() {
  const { user } = useRequireAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  const load = useCallback(() => teamsApi.mine().then(setTeam).finally(() => setReady(true)), []);
  useEffect(() => { if (user) load(); }, [user, load]);

  const run = (fn: () => Promise<unknown>) => async (e?: FormEvent) => {
    e?.preventDefault(); setErr("");
    try { await fn(); await load(); } catch (x) { setErr("⚠ " + (x as Error).message); }
  };
  const val = (e: FormEvent, k: string) => String(new FormData(e.currentTarget as HTMLFormElement).get(k));

  if (!user || !ready) return <PageSkeleton />;

  if (!team) return (
    <>
      <SectionHeader tag="TEAM" title="Team formation" sub="Create a squad or join one with an invitation code." />
      <div className="grid gap-4 md:grid-cols-2">
        <Card><h3 className="mb-3 font-bold text-gold">Create a team</h3>
          <form className="grid gap-3" onSubmit={(e) => run(() => teamsApi.create(val(e, "n")))(e)}><Field label="Team name"><input name="n" required className={inputCls} /></Field><Button variant="primary">Create</Button></form></Card>
        <Card><h3 className="mb-3 font-bold text-gold">Join a team</h3>
          <form className="grid gap-3" onSubmit={(e) => run(() => teamsApi.join(val(e, "c")))(e)}><Field label="Invitation code"><input name="c" placeholder="TLP-XXXXXX" required className={inputCls} /></Field><Button>Join</Button></form>
          {err && <p className="mt-2 text-sm text-rose">{err}</p>}</Card>
      </div>
    </>
  );

  const lead = team.members.find((m) => m.id === team.lead_id);
  return (
    <>
      <SectionHeader tag="TEAM" title={team.name} sub={`Size ${team.members.length}/5 · Leader: ${lead?.name ?? "—"}`} />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <p className="font-mono text-[11px] text-muted">INVITATION CODE</p>
          <div className="my-2 font-mono text-2xl tracking-widest text-gold">{team.code}</div>
          <div className="flex gap-2">
            <a className="rounded border border-gold px-3 py-1.5 font-mono text-[11px] uppercase text-gold" href={`mailto:?subject=Join my team&body=Code: ${team.code}`}>Invite by email</a>
            <Button small onClick={() => { navigator.clipboard?.writeText(team.code); setCopied(true); setTimeout(() => setCopied(false), 1800); }}>{copied ? "Copied ✓" : "Copy code"}</Button>
            <Button small variant="danger" onClick={run(() => teamsApi.leave())}>Leave team</Button>
          </div>
          {err && <p className="mt-2 text-sm text-rose">{err}</p>}
        </Card>
        <Card><h3 className="mb-2 font-bold text-gold">Members</h3>
          <ul className="grid gap-2 text-sm">{team.members.map((m) => <li key={m.id} className="flex items-center justify-between">{m.name} {m.id === team.lead_id && "👑"}<StatusBadge status={m.status} /></li>)}</ul></Card>
      </div>
    </>
  );
}
