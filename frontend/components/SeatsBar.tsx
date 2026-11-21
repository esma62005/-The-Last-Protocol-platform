"use client";
import { useEffect, useState } from "react";
import { publicApi } from "@/services/auth";
import type { PublicStats } from "@/types";

export default function SeatsBar() {
  const [s, setS] = useState<PublicStats | null>(null);
  useEffect(() => { publicApi.stats().then(setS).catch(() => {}); }, []);
  if (!s) return null;
  return (
    <div className="mx-auto mt-6 max-w-xs font-mono text-xs text-muted">
      SEATS CLAIMED {s.taken} / {s.capacity}
      <div className="mt-1.5 h-1.5 overflow-hidden rounded bg-[#2a2e32]"><i className="bar-grow block h-full bg-gradient-to-r from-wine to-gold" style={{ width: `${Math.min(100, (s.taken / s.capacity) * 100)}%` }} /></div>
    </div>
  );
}
