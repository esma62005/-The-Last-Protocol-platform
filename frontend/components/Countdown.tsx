"use client";
import { Fragment, useEffect, useState } from "react";

const TARGET = new Date("2026-12-19T09:00:00").getTime();

export default function Countdown() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const live = now !== null && now >= TARGET;
  let d = Math.max(0, TARGET - (now ?? TARGET));
  const parts = ([["DAYS", 864e5], ["HRS", 36e5], ["MIN", 6e4], ["SEC", 1e3]] as const).map(([label, u]) => {
    const n = Math.floor(d / u); d -= n * u;
    return [label, String(n).padStart(2, "0")];
  });
  return (
    <div className="my-8 text-center">
      <p className="mb-3 font-mono text-[11px] tracking-[.3em] text-muted">{live ? <><span className="live-dot mr-2" />THE PROTOCOL IS LIVE</> : "PROTOCOL INITIATES IN"}</p>
      <div className="flex items-start justify-center gap-1.5 sm:gap-3">
        {parts.map(([l, v], i) => (
          <Fragment key={l}>
            {i > 0 && <span className="mt-3 animate-pulse font-mono text-2xl text-gold/40 sm:mt-4">:</span>}
            <div className="relative min-w-[62px] overflow-hidden rounded-xl border border-gold/20 bg-gradient-to-b from-card to-ink px-2 pb-2 pt-3 shadow-[0_12px_32px_-18px_rgba(197,165,106,.6)] sm:min-w-[82px]">
              <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
              <b key={v} className="tick font-mono text-3xl text-gold sm:text-4xl">{v}</b>
              <span className="block text-[10px] tracking-[.2em] text-muted">{l}</span>
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
