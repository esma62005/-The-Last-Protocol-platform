"use client";
import { useState } from "react";
import { cx, inputCls } from "./ui";

const FAQ = [
  ["Who can participate in the competition?", "Teams of 3 to 5 members with an advanced technical level. Every team designs a startup based on artificial intelligence and cybersecurity."],
  ["Can I participate individually?", "No. The competition is team-based (3 to 5 members). Register your whole team at once: the leader creates the account and adds the other members' Gmail addresses."],
  ["Why do you ask for the members' Gmail?", "The decision (accepted / not retained) is emailed to every member, and the leader sees it on the website dashboard. Members don't need an account."],
  ["How will I know if we are accepted?", "By email on each member's Gmail and on the dashboard of your team (log in with the leader's email). The dashboard refreshes by itself."],
  ["Which technologies are mandatory?", "Artificial intelligence and cybersecurity. Everything else — sector, product and solution — is your choice."],
  ["When does the challenge start?", "On Tuesday 15 December 2026 with check-in at 08:30 and the opening ceremony at the Central Library. Activities run from 08:30 to 20:00 each day; rooms are closed at 20:00 and work resumes the next morning. Closing is on Thursday 17 December at 20:00."],
  ["What is THE LAST FILE?", "An Escape Room in 5 stages (Evidence, Cipher, Pattern, Hidden File, Final Code), 20 to 30 minutes per session. Each team designates representatives."],
  ["What is the Innovation Hub?", "Workshops (AI, Cybersecurity, Entrepreneurship, Prototype Development), Clubs Expo and networking at the Central Library on Wednesday 16 December. Open to students and visitors."],
  ["What do we have to hand in?", "A startup file: Startup Profile, Problem Statement, Technical Architecture, AI Documentation, Security Documentation, Functional MVP, Business Model and Pitch Deck."],
  ["What should I bring?", "Your laptop and charger, your student ID and the QR ticket from your dashboard."],
];

export default function Faq() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<number | null>(0);
  const list = FAQ.map(([a, b], i) => ({ a, b, i })).filter((f) => `${f.a} ${f.b}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <div className="relative mb-5">
        <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">⌕</span>
        <input className={`${inputCls} !pl-9`} placeholder="Search a question..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {list.map(({ a, b, i }, k) => {
        const on = open === i;
        return (
          <div key={a} style={{ animation: "pop .5s cubic-bezier(.2,.7,.2,1) both", animationDelay: `${k * 60}ms` }}
            className={cx("mb-2.5 overflow-hidden rounded-lg border bg-card transition-all duration-300", on ? "border-gold/60 shadow-[0_12px_32px_-18px_rgba(197,165,106,.55)]" : "border-gold/20 hover:border-gold/40")}>
            <button type="button" aria-expanded={on} onClick={() => setOpen(on ? null : i)} className="flex w-full items-center gap-4 p-4 text-left">
              <span className="font-mono text-xs text-gold/60">{String(i + 1).padStart(2, "0")}</span>
              <span className="flex-1 font-semibold">{a}</span>
              <span className={cx("grid h-7 w-7 shrink-0 place-items-center rounded-full border border-gold/30 text-lg leading-none transition-all duration-300", on ? "rotate-45 border-gold bg-gold text-ink" : "text-gold")}>+</span>
            </button>
            <div className={cx("acc", on && "open")}><div><p className="px-4 pb-4 pl-[3.25rem] text-sm text-[#b9b2a5]">{b}</p></div></div>
          </div>
        );
      })}
      {!list.length && <p className="rounded-lg border border-dashed border-gold/20 p-6 text-center font-mono text-sm text-muted">No intel found for “{q}”.</p>}
    </>
  );
}
