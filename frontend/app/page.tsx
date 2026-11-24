import Link from "next/link";
import Countdown from "@/components/Countdown";
import { EventLogo } from "@/components/Logo";
import Reveal from "@/components/Reveal";
import SeatsBar from "@/components/SeatsBar";
import { Card, IconBox, LinkButton, gridCls } from "@/components/ui";

const PAGES = [
  ["/about", "🔍", "About", "The NOVA mission"],
  ["/tracks", "🧭", "Event", "3 volets · deliverables"],
  ["/schedule", "🗓", "Schedule", "08:30 – 20:00 · 3 days"],
  ["/prizes", "🏆", "Prizes", "The rewards"],
  ["/faq", "❓", "FAQ", "Good to know"],
];
const TICKER = ["48 HOURS", "TEAMS OF 3 TO 5", "AI × CYBERSECURITY", "CITY OF NOVA · 2040", "THE LAST FILE · ESCAPE ROOM", "THE INNOVATION HUB", "15–17 DEC 2026", "TLEMCEN"];
const PHASES = [
  ["01", "Investigate", "Analyse the NOVA scenario, identify the needs and spot a real opportunity."],
  ["02", "Innovate", "Choose your sector and design your own startup, with technical and entrepreneurial support."],
  ["03", "Build", "Develop a functional MVP with AI and cybersecurity, then pitch it to the jury on Thursday 17."],
];

const Row = ({ hidden }: { hidden?: boolean }) => (
  <div aria-hidden={hidden} className="flex min-w-[100vw] shrink-0 items-center justify-around">
    {TICKER.map((t) => <span key={t} className="whitespace-nowrap py-3 font-mono text-xs tracking-[.3em] text-gold/80">{t}<b className="ml-10 text-rose">✦</b></span>)}
  </div>
);

export default function Home() {
  return (
    <div className="stagger">
      <section className="py-6 text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/5 px-4 py-1.5 font-mono text-[11px] tracking-[.25em] text-emerald-300">
          <span className="live-dot" />REGISTRATION OPEN
        </div>
        <div className="hero-logo">
          <div className="hero-halo" /><div className="hero-ring r1" /><div className="hero-ring r2" /><div className="hero-scan" />
          <EventLogo size={380} />
        </div>
        <p className="mt-8 font-mono text-xs tracking-[.3em] text-gold">CYWORK — CYBERSECURITY &amp; WORKING PRESENTS</p>
        <h1 className="mt-2 text-[clamp(2.6rem,9vw,6rem)] font-bold leading-none tracking-tight">THE LAST<br /><span className="glitch text-rose" data-t="PROTOCOL">PROTOCOL</span></h1>
        <p className="mb-1 mt-3 font-mono text-sm tracking-[.2em] text-gold/80">CYWORK STARTUP IN 48 HOURS · 2026</p>
        <p className="my-4 font-mono text-gold">&gt; 48 hours. one mission. a new future.<span className="animate-pulse">▌</span></p>
        <div className="flex flex-wrap justify-center gap-2.5">
          {["⏱ 48 Hours", "📍 Tlemcen · Central Library", "📅 15–17 Dec 2026"].map((c) => <span key={c} className="rounded-full border border-gold/20 bg-wine/20 px-4 py-1 text-sm backdrop-blur">{c}</span>)}
        </div>
        <Countdown />
        <div className="flex flex-wrap justify-center gap-3"><LinkButton href="/register" variant="primary">Register Now</LinkButton><LinkButton href="/about">Learn More</LinkButton></div>
        <SeatsBar />
      </section>

      <div className="marquee my-12"><div className="marquee-track"><Row /><Row hidden /></div></div>

      <Reveal>
        <p className="font-mono text-xs tracking-[.3em] text-gold">// EXPLORE</p>
        <h2 className="title-shine my-1 mb-6 text-3xl font-bold md:text-4xl">Everything about the operation</h2>
        <div className={gridCls}>
          {PAGES.map(([href, icon, title, sub]) => (
            <Link key={href} href={href} className="card-fx group block rounded-[10px] border border-gold/20 bg-card p-5">
              <IconBox>{icon}</IconBox><h3 className="my-1 font-bold text-gold">{title}</h3>
              <p className="text-sm text-[#b9b2a5]">{sub} <span className="inline-block transition-transform duration-300 group-hover:translate-x-1.5">→</span></p>
            </Link>
          ))}
        </div>
      </Reveal>

      <Reveal className="mt-20">
        <p className="font-mono text-xs tracking-[.3em] text-gold">// HOW IT WORKS</p>
        <h2 className="title-shine my-1 mb-6 text-3xl font-bold md:text-4xl">Three phases. Zero sleep.</h2>
        <div className={gridCls}>
          {PHASES.map(([n, t, d]) => (
            <Card key={n}><span className="font-mono text-5xl font-bold text-gold/20">{n}</span><h3 className="my-1 font-bold text-gold">{t}</h3><p className="text-sm text-[#b9b2a5]">{d}</p></Card>
          ))}
        </div>
      </Reveal>

      <Reveal className="mt-20">
        <div className="cta"><div className="cta-in">
          <p className="font-mono text-xs tracking-[.3em] text-gold">SEATS ARE LIMITED</p>
          <h2 className="my-3 text-3xl font-bold md:text-5xl">Ready to run the protocol?</h2>
          <p className="mx-auto mb-7 max-w-md text-[#b9b2a5]">Register your team of 3 to 5 in three short steps. The decision reaches every member by Gmail and on the website.</p>
          <LinkButton href="/register" variant="primary">Register your team</LinkButton>
        </div></div>
      </Reveal>
    </div>
  );
}
