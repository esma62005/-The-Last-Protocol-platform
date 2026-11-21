import Link from "next/link";
import { ButtonHTMLAttributes, ReactNode } from "react";
import Reveal from "./Reveal";
import type { Status } from "@/types";

export const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");
export const inputCls = "w-full rounded-md border border-gold/20 bg-ink/80 px-3 py-2.5 text-cream outline-none transition placeholder:text-muted/70 hover:border-gold/40 focus:border-gold focus:shadow-[0_0_0_3px_rgba(197,165,106,.15)]";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("card-fx rounded-[10px] border border-gold/20 bg-card p-5", className)}>{children}</div>;
}

export function SectionHeader({ tag, title, sub }: { tag: string; title: string; sub?: string }) {
  const num = tag.match(/^\d+/)?.[0];
  return (
    <div className="relative mb-8">
      {num && <span aria-hidden className="pointer-events-none absolute -top-8 right-0 select-none font-mono text-[7rem] font-bold leading-none text-gold/[.07] md:text-[10rem]">{num}</span>}
      <p className="font-mono text-xs tracking-[.3em] text-gold">{`// ${tag}`}</p>
      <h2 className="title-shine my-1 text-3xl font-bold md:text-5xl">{title}</h2>
      <i className="title-line" />
      {sub && <p className="mt-3 max-w-xl text-[#b9b2a5]">{sub}</p>}
    </div>
  );
}

const btn = "btn-fx inline-block cursor-pointer rounded border px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50";
const variants = {
  outline: "border-gold text-gold hover:bg-gold hover:text-ink",
  primary: "border-rose bg-gradient-to-r from-wine to-[#8e3640] text-cream animate-pulseRing hover:from-rose hover:to-rose",
  ok: "border-emerald-500/60 text-emerald-400 hover:bg-emerald-500 hover:text-ink",
  danger: "border-rose/60 text-rose hover:bg-rose hover:text-cream",
};
type V = keyof typeof variants;
const cls = (v: V, small?: boolean, extra?: string) => cx(btn, variants[v], small && "!px-3 !py-1.5 !text-[11px]", extra);

export function Button({ variant = "outline", small, className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: V; small?: boolean }) {
  return <button {...p} className={cls(variant, small, className)} />;
}
export function LinkButton({ href, variant = "outline", small, children }: { href: string; variant?: V; small?: boolean; children: ReactNode }) {
  return <Link href={href} className={cls(variant, small)}>{children}</Link>;
}

const badge: Record<Status, string> = {
  pending: "border-gold/50 text-gold", accepted: "border-emerald-500/60 text-emerald-400", rejected: "border-rose text-rose",
};
export function StatusBadge({ status }: { status: Status }) {
  return <span className={cx("rounded border px-2 py-0.5 font-mono text-[11px] uppercase", badge[status])}>{status}</span>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid gap-1 text-sm">{label}{children}</label>;
}

export function HBar({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="my-2 grid grid-cols-[110px_1fr_30px] items-center gap-3 font-mono text-xs">
      <span className="truncate">{label}</span>
      <div className="h-1.5 overflow-hidden rounded bg-[#2a2e32]">
        <i className="bar-grow block h-full bg-gradient-to-r from-wine to-gold" style={{ width: `${max ? (value / max) * 100 : 0}%` }} />
      </div>
      <b className="text-right">{value}</b>
    </div>
  );
}

export function IconBox({ children }: { children: ReactNode }) {
  return <div className="ico-box" aria-hidden>{children}</div>;
}

export function PageSkeleton() {
  return (
    <div aria-busy className="grid gap-4">
      <div className="skel h-28 max-w-md" />
      <div className="grid gap-4 md:grid-cols-2"><div className="skel h-52" /><div className="skel h-52" /></div>
    </div>
  );
}

export const gridCls = "grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(230px,1fr))]";

/** Prev / next navigation at the bottom of the public pages. */
export function PageNav({ prev, next }: { prev?: [string, string]; next?: [string, string] }) {
  const a = "group font-mono text-xs uppercase tracking-widest text-gold transition hover:text-cream";
  const arrow = "inline-block transition-transform duration-300";
  return (
    <Reveal className="mt-14 flex items-center justify-between border-t border-gold/20 pt-6">
      {prev ? <Link href={prev[0]} className={a}><span className={`${arrow} group-hover:-translate-x-1.5`}>←</span> {prev[1]}</Link> : <span />}
      {next ? <Link href={next[0]} className={a}>{next[1]} <span className={`${arrow} group-hover:translate-x-1.5`}>→</span></Link> : <span />}
    </Reveal>
  );
}
