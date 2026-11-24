"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { Button, Card, Field, SectionHeader, StatusBadge, inputCls } from "@/components/ui";
import { MESSAGES } from "@/lib/messages";
import { publicApi } from "@/services/auth";
import type { TeamStatus } from "@/types";

export default function StatusPage() {
  const [res, setRes] = useState<TeamStatus | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setErr(""); setRes(null);
    try { setRes(await publicApi.status(String(f.get("email")), String(f.get("code")))); }
    catch (x) { setErr((x as Error).message); }
    setBusy(false);
  }

  return (
    <>
      <SectionHeader tag="STATUS" title="Check your application" sub="Any team member can check the decision with their Gmail and the team code (sent by email at registration)." />
      <Card className="max-w-md">
        <form onSubmit={submit} className="grid gap-4">
          <Field label="Your Gmail"><input name="email" type="email" required className={inputCls} placeholder="name@gmail.com" /></Field>
          <Field label="Team code"><input name="code" required className={inputCls} placeholder="TLP-XXXXXX" /></Field>
          {err && <p className="text-sm text-rose">⚠ {err}</p>}
          <Button variant="primary" disabled={busy}>Check</Button>
        </form>
        <p className="mt-4 font-mono text-xs text-muted">Team leader? <Link href="/login" className="text-gold">Log in</Link> to see your dashboard.</p>
      </Card>
      {res && (
        <Card className="mt-4 max-w-md text-center">
          <h3 className="font-bold text-gold">{res.team_name}</h3>
          <p className="my-2 font-mono text-xs text-muted">{res.code} · {res.members.join(", ")}</p>
          <StatusBadge status={res.status} />
          <p className="mt-3 text-sm">{MESSAGES[res.status]}</p>
        </Card>
      )}
    </>
  );
}
