"use client";
import { useState } from "react";
import { cx, inputCls } from "./ui";

const FAQ = [
  ["Who can participate?", "Any student or young professional passionate about tech."],
  ["Is participation free?", "Yes. Meals and workshops are included."],
  ["Can I participate individually?", "Yes, and you can create or join a team after registering."],
  ["Do I need programming experience?", "No. Designers and business profiles are welcome."],
  ["What should I bring?", "Laptop, charger, student ID and your QR ticket."],
  ["Can I modify my team after registration?", "Yes, until the hacking phase begins."],
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
