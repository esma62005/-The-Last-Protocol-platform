"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/** Scroll-progress bar, soft cursor light and card spotlight (mouse-follow glow). Pure DOM, no re-renders. */
export default function Effects() {
  const bar = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  const path = usePathname();
  const update = useRef<() => void>(() => {});

  useEffect(() => {
    let raf = 0;
    update.current = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = document.documentElement.scrollHeight - innerHeight;
        if (bar.current) bar.current.style.transform = `scaleX(${h > 0 ? Math.min(1, scrollY / h) : 0})`;
      });
    };
    const on = () => update.current();
    on();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);

    const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const move = (e: PointerEvent) => {
      const g = glow.current;
      if (g) { g.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`; g.classList.add("on"); }
      const c = e.target instanceof Element ? e.target.closest<HTMLElement>(".card-fx") : null;
      if (c) { const r = c.getBoundingClientRect(); c.style.setProperty("--mx", `${e.clientX - r.left}px`); c.style.setProperty("--my", `${e.clientY - r.top}px`); }
    };
    if (fine && !calm) addEventListener("pointermove", move, { passive: true });
    return () => { cancelAnimationFrame(raf); removeEventListener("scroll", on); removeEventListener("resize", on); removeEventListener("pointermove", move); };
  }, []);

  useEffect(() => { update.current(); }, [path]);

  return (<><div ref={bar} className="sp" aria-hidden /><div ref={glow} className="cursor-glow" aria-hidden /></>);
}
