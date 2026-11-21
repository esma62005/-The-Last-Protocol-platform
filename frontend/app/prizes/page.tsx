import Reveal from "@/components/Reveal";
import { Card, IconBox, PageNav, SectionHeader, cx, gridCls } from "@/components/ui";

export const metadata = { title: "Prizes · The Last Protocol" };

const PODIUM = [["2nd", "🥈", 150, 0.75], ["1st", "🥇", 230, 0.55], ["3rd", "🥉", 100, 0.95]] as const;

export default function Prizes() {
  return (
    <>
      <SectionHeader tag="04 REWARDS" title="Prizes" sub="Glory, gear and opportunities." />
      <div className="mb-12 flex items-end justify-center gap-3 sm:gap-5">
        {PODIUM.map(([p, m, h, d]) => {
          const first = p === "1st";
          return (
            <div key={p} className="w-24 text-center sm:w-32">
              <div className={cx("text-4xl", first && "animate-[floaty_3s_ease-in-out_infinite]")}>{m}</div>
              <p className="font-mono text-xs text-gold">{p.toUpperCase()} PLACE</p>
              <div className={cx("rise mt-2 grid place-items-center rounded-t-lg border bg-gradient-to-b font-mono text-sm text-gold", first ? "podium-1 border-gold from-gold/30 to-wine" : "border-gold/30 from-wine to-ink")} style={{ height: h, animationDelay: `${d}s` }}>TBA</div>
            </div>
          );
        })}
      </div>
      <Reveal>
        <div className={gridCls}>
          {[["🎨", "Best UI/UX"], ["🛡️", "Best Security"], ["🤝", "Sponsor Picks"], ["📜", "Certificates for all"]].map(([i, t]) => (
            <Card key={t}><IconBox>{i}</IconBox><h3 className="font-bold text-gold">{t}</h3></Card>
          ))}
        </div>
      </Reveal>
      <PageNav prev={["/schedule", "Schedule"]} next={["/faq", "FAQ"]} />
    </>
  );
}
