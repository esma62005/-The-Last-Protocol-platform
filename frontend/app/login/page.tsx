"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { Button, Card, Field, SectionHeader, inputCls } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "@/components/PageTransition";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setErr("");
    try {
      const role = await login(String(f.get("email")), String(f.get("pw")));
      navigate(role === "admin" ? "/admin" : "/dashboard");
    } catch (x) { setErr((x as Error).message); setBusy(false); }
  }

  return (
    <>
      <SectionHeader tag="ACCESS" title="Agent login" sub="Participants use their registration email. Organizers use the admin account." />
      <Card className="max-w-md">
        <form onSubmit={submit} className="grid gap-4">
          <Field label="Email"><input name="email" type="email" required className={inputCls} /></Field>
          <Field label="Password"><input name="pw" type="password" required className={inputCls} /></Field>
          {err && <p className="text-sm text-rose">⚠ {err}</p>}
          <Button variant="primary" disabled={busy}>{busy ? "Verifying…" : "Enter"}</Button>
        </form>
        <p className="mt-4 font-mono text-xs text-muted">No account? <Link href="/register" className="text-gold">Register</Link></p>
      </Card>
    </>
  );
}
