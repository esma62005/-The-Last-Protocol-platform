"use client";
import { useEffect, useRef, useState } from "react";

/** Animated number; starts once the transition cover has left AND the number is on screen. */
export default function CountUp({ to, ms = 1100 }: { to: number; ms?: number }) {
  const [v, setV] = useState(0);
  const cur = useRef(0);
  const el = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const root = document.documentElement;
    let raf = 0, io: IntersectionObserver | undefined, mo: MutationObserver | undefined;
    const run = () => {
      const from = cur.current; let t0 = 0;
      const step = (t: number) => {
        t0 ||= t;
        const p = Math.min(1, (t - t0) / ms);
        cur.current = from + (to - from) * (1 - Math.pow(1 - p, 3));
        setV(Math.round(cur.current));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    const watch = () => {
      io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io?.disconnect(); run(); } });
      if (el.current) io.observe(el.current);
    };
    if (!root.classList.contains("covered")) watch();
    else {
      mo = new MutationObserver(() => { if (!root.classList.contains("covered")) { mo?.disconnect(); watch(); } });
      mo.observe(root, { attributes: true, attributeFilter: ["class"] });
    }
    return () => { io?.disconnect(); mo?.disconnect(); cancelAnimationFrame(raf); };
  }, [to, ms]);
  return <span ref={el}>{v}</span>;
}
