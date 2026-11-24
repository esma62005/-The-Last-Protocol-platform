import CountUp from "@/components/CountUp";
import Reveal from "@/components/Reveal";
import { Card, IconBox, LinkButton, PageNav, SectionHeader, gridCls } from "@/components/ui";

export const metadata = { title: "About · The Last Protocol" };

const OBJECTIVES = [
  "Encourage innovation, creativity and entrepreneurial spirit among students.",
  "Identify a problem, analyse its stakes and propose a relevant technological solution.",
  "Put AI, cybersecurity and software development skills into practice.",
  "Build security into a digital solution from the very design stage.",
  "Foster teamwork, time management, problem solving and project pitching.",
  "Create a space for exchange between students, university clubs, mentors and speakers.",
];

export default function About() {
  return (
    <>
      <SectionHeader tag="01 BRIEFING" title="One mission. A new future." sub="THE LAST PROTOCOL — CYWORK Startup in 48 Hours is a guided innovation challenge organised by CYWORK (Cybersecurity & Working) from 15 to 17 December 2026. Teams of 3 to 5 design a technology startup and build a prototype based on artificial intelligence and cybersecurity." />
      <Card className="mb-4">
        <p className="font-mono text-xs tracking-[.25em] text-rose">THE SCENARIO</p>
        <h3 className="my-1 text-xl font-bold text-gold">NOVA, 2040</h3>
        <p className="text-sm text-[#b9b2a5]">A futuristic city called NOVA faces a major crisis: its infrastructure, economy and essential services are failing. A mysterious event named THE LAST PROTOCOL triggered problems that traditional organisations can no longer solve. A new generation of innovators is called in — your mission is to create startups able to solve the city&apos;s problems and build its future.</p>
      </Card>
      <div className={gridCls}>
        {[["🔍", "Investigate", "Analyse the common problem and identify an opportunity."], ["💡", "Innovate", "Pick your sector and imagine your own startup."], ["⚙️", "Build", "Develop a prototype, build a business model and pitch."]].map(([i, t, d]) => (
          <Card key={t}><IconBox>{i}</IconBox><h3 className="my-1 font-bold text-gold">{t}</h3><p className="text-sm text-[#b9b2a5]">{d}</p></Card>
        ))}
      </div>
      <Reveal className="mt-4"><div className={gridCls}>
        {[["48", "Hours"], ["3", "Volets"], ["3–5", "Members per team"], ["2", "Mandatory pillars"]].map(([n, l]) => (
          <Card key={l}><div className="font-mono text-4xl font-bold text-gold">{/^\d+$/.test(n) ? <CountUp to={+n} /> : n}</div><p className="text-sm text-[#b9b2a5]">{l}</p></Card>
        ))}
      </div></Reveal>
      <Reveal className="mt-4"><div className="grid gap-4 md:grid-cols-2">
        <Card><h3 className="mb-2 font-bold text-gold">Who can take part</h3>
          <ul className="grid gap-1.5 text-sm text-[#b9b2a5]">
            <li>• Competition: teams of 3 to 5 members, advanced technical level.</li>
            <li>• Free choice of sector, product and solution — but AI and cybersecurity are mandatory.</li>
            <li>• Innovation Hub: open to students and visitors.</li>
            <li>• THE LAST FILE (Escape Room): reserved for competition participants.</li>
          </ul></Card>
        <Card><h3 className="mb-2 font-bold text-gold">Objectives</h3>
          <ul className="grid gap-1.5 text-sm text-[#b9b2a5]">{OBJECTIVES.map((o) => <li key={o}>• {o}</li>)}</ul></Card>
      </div></Reveal>
      <Reveal className="mt-8"><LinkButton href="/register" variant="primary">Register your team</LinkButton></Reveal>
      <PageNav next={["/tracks", "Event"]} />
    </>
  );
}
