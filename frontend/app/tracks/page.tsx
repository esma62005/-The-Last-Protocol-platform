import Reveal from "@/components/Reveal";
import { Card, IconBox, PageNav, SectionHeader, gridCls } from "@/components/ui";

export const metadata = { title: "Event · The Last Protocol" };

const VOLETS = [
  ["💡", "Competition Room", "The Startup competition: problem analysis, solution design, prototype development, checkpoints, technical and entrepreneurial support, final pitches.", ["Startup", "MVP", "Pitch"], "Competition room · Central Library & presentation room for key moments"],
  ["🗝️", "THE LAST FILE", "An Escape Room reserved for participants: representatives designated by each team take part in a 20 to 30 minute session.", ["5 stages", "20–30 min", "Reps only"], "Escape Room room"],
  ["🛠️", "The Innovation Hub", "Workshops (AI, Cybersecurity, Entrepreneurship & Startup Creation, Prototype Development), Clubs Expo, club presentations and networking.", ["Workshops", "Clubs Expo", "Networking"], "Central Library · Clubs Expo area"],
] as const;
const STAGES = [["The Evidence", "identify the clues"], ["The Cipher", "decrypt a message"], ["The Pattern", "solve a logical sequence"], ["The Hidden File", "discover a hidden file"], ["The Final Code", "final resolution"]];
const DELIVERABLES = [
  ["Startup Profile", "Name, logo, vision and mission"], ["Problem Statement", "Problem and targeted users"],
  ["Technical Architecture", "Global architecture of the system"], ["AI Documentation", "Model, data, operation and evaluation"],
  ["Security Documentation", "Threats, risks and protections"], ["Functional MVP", "Demonstrable prototype"],
  ["Business Model", "Customers, revenue, value proposition"], ["Pitch Deck", "Presentation of the startup"],
];

export default function Event() {
  return (
    <>
      <SectionHeader tag="02 EVENT" title="Three volets, one mission" sub="The event is built around three complementary parts. Each team also hands in a complete startup file before the deadline." />
      <div className={gridCls}>
        {VOLETS.map(([i, t, d, tags, place], k) => (
          <Card key={t}>
            <span className="float-right font-mono text-2xl text-gold/30">0{k + 1}</span>
            <IconBox>{i}</IconBox><h3 className="my-1 font-bold text-gold">{t}</h3><p className="text-sm text-[#b9b2a5]">{d}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">{tags.map((x) => <i key={x} className="rounded border border-gold/20 px-2 py-0.5 font-mono text-[11px] not-italic text-gold">{x}</i>)}</div>
            <p className="mt-3 font-mono text-[11px] text-muted">📍 {place}</p>
          </Card>
        ))}
      </div>
      <Reveal className="mt-10">
        <Card>
          <h3 className="mb-1 font-bold text-gold">THE LAST FILE — a session in 5 stages</h3>
          <p className="mb-4 text-sm text-[#b9b2a5]">Reserved for competition participants. Sessions follow the rotations planned in the programme.</p>
          <ol className="grid gap-2 sm:grid-cols-5">
            {STAGES.map(([t, d], i) => (
              <li key={t} className="rounded-lg border border-gold/15 bg-ink/60 p-3 text-center"><span className="font-mono text-2xl text-gold/40">{i + 1}</span><b className="block text-sm text-gold">{t}</b><span className="text-xs text-[#b9b2a5]">{d}</span></li>
            ))}
          </ol>
        </Card>
      </Reveal>
      <Reveal className="mt-4">
        <Card>
          <h3 className="mb-3 font-bold text-gold">Deliverables · each team&apos;s file</h3>
          <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {DELIVERABLES.map(([t, d], i) => (
              <div key={t} className="flex gap-3 border-b border-gold/10 pb-2 text-sm"><span className="font-mono text-gold/50">{String(i + 1).padStart(2, "0")}</span><div><b>{t}</b><p className="text-[#b9b2a5]">{d}</p></div></div>
            ))}
          </div>
          <p className="mt-4 text-sm text-[#b9b2a5]">Teams then pitch their startup to the jury during the final presentations on Thursday 17 December 2026.</p>
        </Card>
      </Reveal>
      <PageNav prev={["/about", "About"]} next={["/schedule", "Schedule"]} />
    </>
  );
}
