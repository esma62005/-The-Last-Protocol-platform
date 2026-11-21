"use client";
import { useState } from "react";
import { cx } from "./ui";

const DAYS: Record<string, [string, string, string][]> = {
  "Day 1": [["08:00", "Check-in (QR)", "Badge, welcome kit, seating."], ["09:00", "Opening Ceremony", "Mission reveal and rules."], ["10:00", "Team Formation", "Find teammates, lock your squad."], ["11:00", "Hacking Begins", "The clock starts: 48:00:00."], ["18:00", "Workshops & Mentors", "Pitching, security, product."]],
  "Day 2": [["09:00", "Mentor rounds", "Feedback from experts."], ["11:00", "Project Submission", "Repo + demo link. Protocol closes."]],
  Finale: [["14:00", "Presentations", "5-minute pitch to the jury."], ["17:00", "Awards Ceremony", "Winners announced."]],
};

export default function ScheduleTabs() {
  const [day, setDay] = useState("Day 1");
  return (
    <>
      <div role="tablist" className="mb-7 inline-flex gap-1 rounded-lg border border-gold/20 bg-card/80 p-1 backdrop-blur">
        {Object.keys(DAYS).map((d) => (
          <button key={d} role="tab" aria-selected={d === day} onClick={() => setDay(d)}
            className={cx("rounded-md px-5 py-2 font-mono text-xs transition-all duration-300", d === day ? "bg-gold text-ink shadow-[0_6px_18px_-6px_rgba(197,165,106,.8)]" : "text-gold hover:bg-gold/10")}>{d}</button>
        ))}
      </div>
      <div key={day} className="tl">
        {DAYS[day].map(([t, h, p], i) => (
          <div key={t} className="tl-item" style={{ animationDelay: `${i * 90}ms` }}>
            <time className="inline-block rounded bg-gold/10 px-2 py-0.5 font-mono text-xs text-gold">{t}</time>
            <h4 className="mt-1.5 font-bold">{h}</h4>
            <p className="text-sm text-[#b9b2a5]">{p}</p>
          </div>
        ))}
      </div>
    </>
  );
}
