import Reveal from "@/components/Reveal";
import { Card, IconBox, PageNav, SectionHeader, gridCls } from "@/components/ui";

export const metadata = { title: "Tracks · The Last Protocol" };

const TRACKS = [
  ["🤖", "Artificial Intelligence", "Smart assistants, computer vision, automation.", ["Python", "LLMs", "ML"]],
  ["🛡️", "Cybersecurity", "Defence, privacy, secure-by-design systems.", ["Pentest", "Crypto", "SecOps"]],
  ["🌐", "Web & Mobile", "Products people love to use.", ["React", "Flutter", "UI/UX"]],
  ["🚀", "Startup & Impact", "Business models with real-world impact.", ["Pitch", "MVP", "Market"]],
] as const;
const CRITERIA = [["Innovation", 30], ["Technical execution", 30], ["Impact & market", 20], ["Pitch & demo", 20]] as const;

export default function Tracks() {
  return (
    <>
      <SectionHeader tag="02 TRACKS" title="Choose your field" sub="Pick one preferred track at registration." />
      <div className={gridCls}>
        {TRACKS.map(([i, t, d, tags], k) => (
          <Card key={t} >
            <span className="float-right font-mono text-2xl text-gold/30">0{k + 1}</span>
            <IconBox>{i}</IconBox><h3 className="my-1 font-bold text-gold">{t}</h3><p className="text-sm text-[#b9b2a5]">{d}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">{tags.map((x) => <i key={x} className="rounded border border-gold/20 px-2 py-0.5 font-mono text-[11px] not-italic text-gold">{x}</i>)}</div>
          </Card>
        ))}
      </div>
      <Reveal className="mt-10">
        <Card>
          <h3 className="mb-3 font-bold text-gold">Judging criteria</h3>
          {CRITERIA.map(([c, v]) => (
            <div key={c} className="my-3 grid grid-cols-[110px_1fr_40px] items-center gap-3 font-mono text-xs sm:grid-cols-[170px_1fr_40px]"><span>{c}</span><div className="h-2 rounded bg-[#2a2e32]"><i className="bar-grow block h-full rounded bg-gradient-to-r from-wine to-gold shadow-[0_0_12px_rgba(197,165,106,.5)]" style={{ width: `${v * 3}%` }} /></div><b className="text-right text-gold">{v}%</b></div>
          ))}
        </Card>
      </Reveal>
      <PageNav prev={["/about", "About"]} next={["/schedule", "Schedule"]} />
    </>
  );
}
