"use client";
import { ReactNode, useEffect, useRef } from "react";

/** Fades/slides its content in when it scrolls into view (and only after the page-transition cover has left). */
export default function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current!, root = document.documentElement;
    let io: IntersectionObserver | undefined, mo: MutationObserver | undefined;
    const watch = () => {
      io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add("rv-in"); io?.disconnect(); } }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
      io.observe(el);
    };
    if (!root.classList.contains("covered")) watch();
    else {
      mo = new MutationObserver(() => { if (!root.classList.contains("covered")) { mo?.disconnect(); watch(); } });
      mo.observe(root, { attributes: true, attributeFilter: ["class"] });
    }
    return () => { io?.disconnect(); mo?.disconnect(); };
  }, []);
  return <div ref={ref} className={`rv ${className}`} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>{children}</div>;
}
