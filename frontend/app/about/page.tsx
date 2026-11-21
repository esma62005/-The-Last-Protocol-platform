import CountUp from "@/components/CountUp";
import Reveal from "@/components/Reveal";
import { Card, IconBox, LinkButton, PageNav, SectionHeader, gridCls } from "@/components/ui";

export const metadata = { title: "About · The Last Protocol" };

export default function About() {
  return (
    <>
      <SectionHeader tag="01 BRIEFING" title="One mission. A new future." sub="The Last Protocol is a 48-hour startup hackathon by CYWORK Club. Teams investigate a real problem, innovate a solution and build a working prototype before the protocol closes." />
      <div className={gridCls}>
        {[["🔍", "Investigate", "Pick a challenge, research, define the real problem."], ["💡", "Innovate", "Design a bold solution with mentor guidance."], ["⚙️", "Build", "Ship an MVP and pitch it in 5 minutes."]].map(([i, t, d]) => (
          <Card key={t}><IconBox>{i}</IconBox><h3 className="my-1 font-bold text-gold">{t}</h3><p className="text-sm text-[#b9b2a5]">{d}</p></Card>
        ))}
      </div>
      <Reveal className="mt-4"><div className={gridCls}>
        {[["48", "Hours"], ["4", "Tracks"], ["3", "Phases"], ["2–5", "Per team"]].map(([n, l]) => (
          <Card key={l}><div className="font-mono text-4xl font-bold text-gold">{/^\d+$/.test(n) ? <CountUp to={+n} /> : n}</div><p className="text-sm text-[#b9b2a5]">{l}</p></Card>
        ))}
      </div></Reveal>
      <Reveal className="mt-4"><Card><h3 className="font-bold text-gold">Eligibility</h3><p className="text-sm text-[#b9b2a5]">Students and young professionals. Teams of 2 to 5 members, individuals welcome (you can find a team on site). No programming experience required for design, business and marketing profiles.</p></Card></Reveal>
      <Reveal className="mt-8"><LinkButton href="/register" variant="primary">Join the operation</LinkButton></Reveal>
      <PageNav next={["/tracks", "Tracks"]} />
    </>
  );
}
