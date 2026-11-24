import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import MatrixRain from "@/components/MatrixRain";
import Navbar from "@/components/Navbar";
import Effects from "@/components/Effects";
import Logo from "@/components/Logo";
import Link from "next/link";
import Transitions, { PageEnter } from "@/components/PageTransition";

const sans = Space_Grotesk({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = { title: "The Last Protocol – CYWORK Startup in 48 Hours", description: "Startup challenge by CYWORK · AI & Cybersecurity · Tlemcen · 15–17 December 2026" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <AuthProvider>
          <Transitions>
          <div className="aurora" aria-hidden><i /><i /><i /><div className="grid-bg" /><div className="vignette" /></div>
          <MatrixRain />
          <Effects />
          <Navbar />
          <main className="relative z-10 mx-auto min-h-[80vh] max-w-[1100px] px-[5vw] pb-10 pt-24"><PageEnter>{children}</PageEnter></main>
          <footer className="relative z-10 mt-10 border-t border-gold/15 bg-ink/60 backdrop-blur">
            <div className="mx-auto flex max-w-[1100px] flex-col items-center justify-between gap-5 px-[5vw] py-8 md:flex-row">
              <div className="flex items-center gap-3">
                <Logo size={38} />
                <div><p className="font-bold tracking-[.12em] text-gold">CYWORK</p><p className="font-mono text-[11px] text-muted">THE LAST PROTOCOL · TLEMCEN</p></div>
              </div>
              <nav className="flex flex-wrap justify-center gap-5 font-mono text-xs text-muted">
                {["about", "tracks", "schedule", "prizes", "faq", "register"].map((s) => <Link key={s} href={`/${s}`} className="uppercase tracking-widest transition hover:text-gold">{s === "tracks" ? "event" : s}</Link>)}
              </nav>
              <p className="font-mono text-xs text-muted">© 2026 CYWORK ARCHIVE · <span className="text-rose">CLASSIFIED</span></p>
            </div>
          </footer>
          </Transitions>
        </AuthProvider>
      </body>
    </html>
  );
}
