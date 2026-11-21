"use client";
import { useEffect, useRef } from "react";

export default function MatrixRain() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cv = ref.current!, ctx = cv.getContext("2d")!;
    const size = 18;
    let drops: number[] = [], w = 0, h = 0, last = 0, raf = 0;
    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = innerWidth; h = innerHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = "14px monospace";
      drops = Array.from({ length: Math.ceil(w / size) }, () => Math.random() * -50);
    };
    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      if (document.hidden || t - last < 60) return; // ~16fps, paused when the tab is hidden
      last = t;
      ctx.globalCompositeOperation = "destination-out"; // fade trails while keeping the canvas transparent (aurora stays visible)
      ctx.fillStyle = "rgba(0,0,0,.14)"; ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
      drops.forEach((y, i) => {
        ctx.fillStyle = Math.random() < 0.08 ? "#C5A56A" : "#762D35";
        ctx.fillText(Math.random() < 0.5 ? "0" : "1", i * size, y * size);
        drops[i] = y * size > h && Math.random() > 0.975 ? 0 : y + 1;
      });
    };
    resize();
    addEventListener("resize", resize);
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-0 opacity-25 [mask-image:linear-gradient(#000,transparent_90%)]" />;
}
