"use client";
import { Fragment, useRef, useState } from "react";
import { Button, Card, Field, SectionHeader, cx, inputCls } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "@/components/PageTransition";
import { RegisterPayload, TRACKS } from "@/types";

const LEVELS = ["Licence 1–2", "Licence 3", "Master", "PhD", "Professional"];
const STEPS = ["A · PERSONAL", "B · TECHNICAL", "C · PARTICIPATION", "D · ADDITIONAL"];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const form = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(0);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const I = (name: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => <input name={name} className={inputCls} {...props} />;
  const sel = (name: string, opts: string[]) => <select name={name} className={inputCls}>{opts.map((o) => <option key={o}>{o}</option>)}</select>;
  const show = (i: number) => (step === i ? "grid gap-4 step-in" : "hidden");

  async function next() {
    const fs = form.current!.querySelectorAll("fieldset")[step];
    const bad = [...fs.querySelectorAll<HTMLInputElement>("[required]")].find((i) => !i.checkValidity());
    if (bad) { bad.focus(); setErr("⚠ Please complete the required fields."); return; }
    setErr("");
    if (step < 3) return setStep(step + 1);
    const d = Object.fromEntries(new FormData(form.current!)) as Record<string, FormDataEntryValue>;
    setBusy(true);
    try {
      await register({ ...d, accept_rules: true } as unknown as RegisterPayload);
      navigate(d.participation_type === "Team" ? "/teams" : "/dashboard");
    } catch (x) { setErr("⚠ " + (x as Error).message); setBusy(false); }
  }

  return (
    <>
      <SectionHeader tag="05 ENROLLMENT" title="Join the operation" sub="Four short steps. Your ticket is issued instantly." />
      <Card className="max-w-2xl">
        <div className="mb-6 flex items-center">
          {STEPS.map((x, i) => (
            <Fragment key={x}>
              <span className={cx("grid h-8 w-8 shrink-0 place-items-center rounded-full border font-mono text-xs transition-all duration-500", i < step ? "border-gold bg-gold text-ink" : i === step ? "border-gold text-gold shadow-[0_0_0_4px_rgba(197,165,106,.15)]" : "border-gold/20 text-muted")}>{i < step ? "✓" : i + 1}</span>
              {i < 3 && <i className="relative mx-2 h-0.5 flex-1 rounded bg-gold/15"><b className="absolute inset-y-0 left-0 rounded bg-gold transition-all duration-500" style={{ width: i < step ? "100%" : "0%" }} /></i>}
            </Fragment>
          ))}
        </div>
        <form ref={form} noValidate onSubmit={(e) => e.preventDefault()}>
          <fieldset className={show(0)}><legend className="mb-3 font-mono text-xs text-gold">{STEPS[0]}</legend>
            <Field label="Full name">{I("name", { required: true })}</Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Email">{I("email", { type: "email", required: true })}</Field>
              <Field label="Password (8+ chars)">{I("password", { type: "password", minLength: 8, required: true })}</Field>
              <Field label="Phone">{I("phone", { type: "tel", required: true })}</Field>
              <Field label="University / School">{I("university", { required: true })}</Field>
              <Field label="Field of study">{I("field_of_study", { required: true })}</Field>
              <Field label="Level">{sel("level", LEVELS)}</Field>
            </div>
          </fieldset>
          <fieldset className={show(1)}><legend className="mb-3 font-mono text-xs text-gold">{STEPS[1]}</legend>
            <Field label="Skills">{I("skills", { placeholder: "Python, JavaScript, AI, UI/UX" })}</Field>
            <Field label="Experience">{sel("experience", ["Beginner", "Intermediate", "Advanced"])}</Field>
            <div className="grid gap-4 md:grid-cols-2"><Field label="GitHub (optional)">{I("github")}</Field><Field label="Portfolio (optional)">{I("portfolio")}</Field></div>
          </fieldset>
          <fieldset className={show(2)}><legend className="mb-3 font-mono text-xs text-gold">{STEPS[2]}</legend>
            <div className="grid gap-4 md:grid-cols-2"><Field label="Type">{sel("participation_type", ["Individual", "Team"])}</Field><Field label="Preferred track">{sel("track", TRACKS)}</Field></div>
            <p className="text-xs text-muted">Teams are created or joined from your Team page right after registration.</p>
          </fieldset>
          <fieldset className={show(3)}><legend className="mb-3 font-mono text-xs text-gold">{STEPS[3]}</legend>
            <Field label="Why do you want to participate?"><textarea name="motivation" rows={3} className={inputCls} /></Field>
            <Field label="Previous hackathons">{I("previous_hackathons")}</Field>
            <Field label="Special requirements (optional)">{I("special_requirements")}</Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="accept" required /> I accept the rules of the operation.</label>
          </fieldset>
          {err && <p className="mt-3 text-sm text-rose">{err}</p>}
          <div className="mt-5 flex justify-between">
            <Button type="button" onClick={() => setStep(step - 1)} className={step ? "" : "invisible"}>Back</Button>
            <Button type="button" variant="primary" onClick={next} disabled={busy}>{busy ? "Creating ticket…" : step === 3 ? "Submit" : "Next"}</Button>
          </div>
        </form>
      </Card>
    </>
  );
}
