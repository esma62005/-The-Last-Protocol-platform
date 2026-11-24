"use client";
import { Fragment, useRef, useState } from "react";
import { Button, Card, Field, SectionHeader, cx, inputCls } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "@/components/PageTransition";
import { RegisterPayload } from "@/types";

const LEVELS = ["Licence 1–2", "Licence 3", "Master", "PhD", "Professional"];
const STEPS = ["A · TEAM & LEADER", "B · MEMBERS", "C · OPTIONAL INFO"];
const GMAIL = /^[A-Za-z0-9._%+-]+@(gmail|googlemail)\.com$/i;
const MIN_MEMBERS = 2, MAX_MEMBERS = 4; // + the leader = a team of 3 to 5

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const form = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(0);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [members, setMembers] = useState(["", ""]);
  const I = (name: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => <input name={name} className={inputCls} {...props} />;
  const sel = (name: string, opts: string[]) => <select name={name} className={inputCls}>{opts.map((o) => <option key={o}>{o}</option>)}</select>;
  const show = (i: number) => (step === i ? "grid gap-4 step-in" : "hidden");
  const setMember = (i: number, v: string) => setMembers(members.map((m, k) => (k === i ? v : m)));

  async function next() {
    const f = form.current!;
    const fs = f.querySelectorAll("fieldset")[step];
    const bad = [...fs.querySelectorAll<HTMLInputElement>("[required]")].find((i) => !i.checkValidity());
    if (bad) { bad.focus(); setErr("⚠ Please complete the required fields."); return; }
    if (step === 1) {
      const list = members.map((m) => m.trim().toLowerCase());
      const leader = String(new FormData(f).get("email")).trim().toLowerCase();
      if (list.some((m) => !GMAIL.test(m))) return setErr("⚠ Every member needs a valid Gmail address (name@gmail.com).");
      if (new Set([...list, leader]).size !== list.length + 1) return setErr("⚠ Each person needs a different email address.");
    }
    setErr("");
    if (step < STEPS.length - 1) return setStep(step + 1);
    const d = Object.fromEntries(new FormData(f)) as Record<string, string>;
    delete d.member_email; delete d.accept; // sent separately / not part of the payload
    setBusy(true);
    try {
      await register({ ...d, member_emails: members.map((m) => m.trim().toLowerCase()), accept_rules: true } as unknown as RegisterPayload);
      navigate("/dashboard");
    } catch (x) { setErr("⚠ " + (x as Error).message); setBusy(false); }
  }

  return (
    <>
      <SectionHeader tag="05 ENROLLMENT" title="Register your team" sub="One registration per team (3 to 5 members). The decision is sent to every member's Gmail and shown on your dashboard." />
      <Card className="max-w-2xl">
        <div className="mb-6 flex items-center">
          {STEPS.map((x, i) => (
            <Fragment key={x}>
              <span className={cx("grid h-8 w-8 shrink-0 place-items-center rounded-full border font-mono text-xs transition-all duration-500", i < step ? "border-gold bg-gold text-ink" : i === step ? "border-gold text-gold shadow-[0_0_0_4px_rgba(197,165,106,.15)]" : "border-gold/20 text-muted")}>{i < step ? "✓" : i + 1}</span>
              {i < STEPS.length - 1 && <i className="relative mx-2 h-0.5 flex-1 rounded bg-gold/15"><b className="absolute inset-y-0 left-0 rounded bg-gold transition-all duration-500" style={{ width: i < step ? "100%" : "0%" }} /></i>}
            </Fragment>
          ))}
        </div>
        <form ref={form} noValidate onSubmit={(e) => e.preventDefault()}>
          <fieldset className={show(0)}><legend className="mb-3 font-mono text-xs text-gold">{STEPS[0]}</legend>
            <Field label="Team name">{I("team_name", { required: true, maxLength: 80 })}</Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Leader full name">{I("name", { required: true })}</Field>
              <Field label="Leader email (Gmail recommended)">{I("email", { type: "email", required: true })}</Field>
              <Field label="Password (8+ chars)">{I("password", { type: "password", minLength: 8, required: true })}</Field>
              <Field label="University / School">{I("university", { required: true })}</Field>
              <Field label="Field of study">{I("field_of_study", { required: true })}</Field>
              <Field label="Level">{sel("level", LEVELS)}</Field>
            </div>
          </fieldset>
          <fieldset className={show(1)}><legend className="mb-1 font-mono text-xs text-gold">{STEPS[1]} · GMAIL OF EACH TEAMMATE</legend>
            <p className="text-sm text-[#b9b2a5]">Add the other {MIN_MEMBERS} to {MAX_MEMBERS} members of the team. They will all be notified by email when your team is accepted.</p>
            {members.map((m, i) => (
              <div key={i} className="flex items-end gap-2">
                <div className="flex-1"><Field label={`Member ${i + 2}`}>{I("member_email", { type: "email", required: true, placeholder: "name@gmail.com", value: m, onChange: (e) => setMember(i, e.target.value) })}</Field></div>
                {members.length > MIN_MEMBERS && <Button type="button" small variant="danger" onClick={() => setMembers(members.filter((_, k) => k !== i))} aria-label="Remove member">✕</Button>}
              </div>
            ))}
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-muted">TEAM SIZE {members.length + 1} / {MAX_MEMBERS + 1}</span>
              {members.length < MAX_MEMBERS && <Button type="button" small onClick={() => setMembers([...members, ""])}>+ Add a member</Button>}
            </div>
          </fieldset>
          <fieldset className={show(2)}><legend className="mb-3 font-mono text-xs text-gold">{STEPS[2]} · YOU CAN SKIP ALL OF THIS</legend>
            <Field label="Team skills (optional)">{I("skills", { placeholder: "Python, JavaScript, AI, UI/UX" })}</Field>
            <Field label="Overall experience">{sel("experience", ["Beginner", "Intermediate", "Advanced"])}</Field>
            <div className="grid gap-4 md:grid-cols-2"><Field label="GitHub (optional)">{I("github")}</Field><Field label="Portfolio (optional)">{I("portfolio")}</Field></div>
            <Field label="Why do you want to participate? (optional)"><textarea name="motivation" rows={3} className={inputCls} /></Field>
            <Field label="Previous hackathons (optional)">{I("previous_hackathons")}</Field>
            <Field label="Special requirements (optional)">{I("special_requirements")}</Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="accept" required /> We accept the rules of the event.</label>
          </fieldset>
          {err && <p className="mt-3 text-sm text-rose">{err}</p>}
          <div className="mt-5 flex justify-between">
            <Button type="button" onClick={() => setStep(step - 1)} className={step ? "" : "invisible"}>Back</Button>
            <Button type="button" variant="primary" onClick={next} disabled={busy}>{busy ? "Registering…" : step === STEPS.length - 1 ? "Submit" : "Next"}</Button>
          </div>
        </form>
      </Card>
    </>
  );
}
