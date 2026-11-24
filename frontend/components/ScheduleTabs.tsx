"use client";
import { useState } from "react";
import { cx } from "./ui";

type Row = [time: string, title: string, place?: string];
type Block = { label?: string; rows: Row[]; note?: string };
type Day = { blocks: Block[] };

const LIB = "Central Library", ROOM = "Competition room", PRES = "Presentation room", FOOD = "Restaurant area";

const HUB = (rows: Row[]): Block => ({ label: "B · The Innovation Hub — Central Library", rows });

const DAYS: Record<string, Day> = {
  "Tue 15": { blocks: [{ label: "THE PROTOCOL BEGINS", rows: [
    ["08:30 – 09:30", "Welcome and participant registration", LIB],
    ["09:30 – 10:00", "Official opening ceremony", LIB],
    ["10:00 – 10:30", "Challenge launch and NOVA scenario presentation", LIB],
    ["10:30 – 11:00", "Mission files handed out and briefing", ROOM],
    ["11:00 – 13:00", "Problem analysis and brainstorming", ROOM],
    ["13:00 – 14:00", "Lunch break", FOOD],
    ["14:00 – 16:00", "Solution design and startup architecture", ROOM],
    ["16:00 – 18:00", "Initial prototype development", ROOM],
    ["18:00 – 19:00", "Break", FOOD],
    ["19:00 – 19:45", "Technical and entrepreneurial support", ROOM],
    ["19:45 – 20:00", "Projects backup and closing", ROOM],
  ] }] },
  "Wed 16": { blocks: [
    { label: "A · Competition Room", rows: [
      ["08:30 – 09:00", "Welcome, teams resume"],
      ["09:00 – 10:00", "Technical checkpoint and progress review"],
      ["10:00 – 12:00", "Prototype development"],
      ["12:00 – 13:00", "Lunch break"],
      ["13:00 – 14:00", "Integration of artificial intelligence and cybersecurity"],
      ["14:00 – 15:00", "Technical tests and support"],
      ["15:00 – 16:00", "Representatives take part in THE LAST FILE"],
      ["16:00 – 18:00", "Prototype development and improvement"],
      ["18:00 – 19:00", "Break"],
      ["19:00 – 19:45", "Last checkpoint of the day"],
      ["19:45 – 20:00", "Backup and closing of the rooms"],
    ] },
    HUB([
      ["08:30 – 09:00", "Clubs set-up and welcome"],
      ["09:00 – 09:45", "Workshop: Artificial Intelligence"],
      ["09:45 – 10:30", "Clubs Expo"],
      ["10:30 – 11:15", "Workshop: Cybersecurity"],
      ["11:15 – 12:00", "Clubs presentations"],
      ["12:00 – 13:00", "Lunch break"],
      ["13:00 – 13:45", "Workshop: Entrepreneurship"],
      ["13:45 – 14:30", "Clubs presentations and demos"],
      ["14:30 – 15:15", "Workshop: Prototype Development"],
      ["15:15 – 16:00", "Networking and stands"],
      ["18:00 – 19:00", "Break"],
      ["19:00 – 19:45", "Last activities and exchanges"],
      ["19:45 – 20:00", "Tidy-up and closing of the spaces"],
    ]),
  ] },
  "Thu 17": { blocks: [{ label: "THE FINAL ACTIVATION", rows: [
    ["08:30 – 09:00", "Welcome, teams resume", ROOM],
    ["09:00 – 12:00", "Prototype finalisation and tests", ROOM],
    ["12:00 – 13:00", "Lunch break", FOOD],
    ["13:00 – 14:00", "Final presentations preparation", ROOM],
    ["14:00 – 15:00", "Deliverables submission and technical preparation", ROOM],
    ["15:00 – 17:00", "Startups final presentations", PRES],
    ["17:00 – 18:00", "Jury deliberation", PRES],
    ["18:00 – 19:00", "Results announcement and prizes", PRES],
    ["19:00 – 19:45", "Official photos, thanks and networking", PRES],
    ["19:45 – 20:00", "Official closing of THE LAST PROTOCOL", PRES],
  ] }] },
};

export default function ScheduleTabs() {
  const [day, setDay] = useState("Tue 15");
  const d = DAYS[day];
  return (
    <>
      <div className="mb-6 rounded-lg border border-gold bg-gold/10 p-3">
        <span className="font-mono text-[11px] text-muted">FORMAT</span>
        <span className="block font-bold tracking-wide text-gold">THE CONTROLLED PROTOCOL · 08:30 – 20:00</span>
        <p className="mt-1 text-sm text-[#b9b2a5]">Supervised hours from 08:30 to 20:00. Rooms are evacuated and closed at 20:00 and work resumes the next morning: three structured days, from Tuesday 15 to Thursday 17 December 2026.</p>
      </div>

      <div role="tablist" className="mb-7 inline-flex flex-wrap gap-1 rounded-lg border border-gold/20 bg-card/80 p-1 backdrop-blur">
        {Object.keys(DAYS).map((x) => (
          <button key={x} role="tab" aria-selected={x === day} onClick={() => setDay(x)}
            className={cx("rounded-md px-5 py-2 font-mono text-xs transition-all duration-300", x === day ? "bg-gold text-ink shadow-[0_6px_18px_-6px_rgba(197,165,106,.8)]" : "text-gold hover:bg-gold/10")}>{x}</button>
        ))}
      </div>

      <div key={day} className="grid gap-8">
        {d.blocks.map((b, bi) => (
          <div key={bi}>
            {b.label && <h3 className="mb-3 font-mono text-xs tracking-[.2em] text-gold">{b.label.toUpperCase()}</h3>}
            <div className="tl">
              {b.rows.map(([t, h, p], i) => (
                <div key={t + h} className="tl-item" style={{ animationDelay: `${i * 60}ms` }}>
                  <time className="inline-block rounded bg-gold/10 px-2 py-0.5 font-mono text-xs text-gold">{t}</time>
                  {p && <span className="ml-2 font-mono text-[11px] text-muted">📍 {p}</span>}
                  <h4 className="mt-1.5 font-bold">{h}</h4>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
