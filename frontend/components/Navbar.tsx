"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Logo from "./Logo";
import { useNavigate } from "./PageTransition";
import { LinkButton, cx } from "./ui";

const PAGES = ["about", "tracks", "schedule", "prizes", "faq"];
const LABELS: Record<string, string> = { faq: "FAQ", tracks: "Event" };
const label = (s: string) => LABELS[s] ?? s[0].toUpperCase() + s.slice(1);

export default function Navbar() {
  const { user, logout } = useAuth();
  const path = usePathname();
  const navigate = useNavigate();
  const pendingLogout = useRef(false);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {  // clear the session only once we are on "/" (avoids the auth guard redirecting to /login)
    if (pendingLogout.current && path === "/") { pendingLogout.current = false; logout(); }
  }, [path, logout]);
  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    const f = () => setScrolled(scrollY > 12);
    f();
    addEventListener("scroll", f, { passive: true });
    return () => removeEventListener("scroll", f);
  }, []);

  const signOut = () => { setOpen(false); if (path === "/") return logout(); pendingLogout.current = true; navigate("/"); };
  const link = (href: string, text: string) => (
    <Link key={href} href={href} className={cx("nav-link", path === href ? "active" : "opacity-70")}>{text}</Link>
  );
  const account: [string, string][] = user?.role === "admin" ? [["/admin", "Admin"]] : user ? [["/dashboard", "Dashboard"]] : [["/login", "Login"]];

  return (
    <nav className={cx("fixed inset-x-0 top-0 z-30 border-b backdrop-blur-md transition-all duration-300", scrolled ? "border-gold/25 bg-ink/90 shadow-[0_10px_30px_-18px_rgba(0,0,0,.9)]" : "border-gold/10 bg-ink/60")}>
      <div className={cx("flex items-center justify-between gap-4 px-[4vw] transition-all duration-300", scrolled ? "py-1.5" : "py-2.5")}>
        <Link href="/" className="flex items-center gap-2 font-bold tracking-[.12em] text-gold"><Logo size={40} />CYWORK</Link>
        <ul className="hidden flex-1 justify-center gap-7 md:flex">{PAGES.map((s) => link(`/${s}`, label(s)))}</ul>
        <div className="hidden items-center gap-5 md:flex">
          {account.map(([h, t]) => link(h, t))}
          {!user && <LinkButton href="/register" variant="primary" small>Register</LinkButton>}
          {user && <button className="nav-link opacity-70" onClick={signOut}>Logout</button>}
        </div>
        <button className={cx("burger md:hidden", open && "open")} aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}><i /><i /><i /></button>
      </div>
      <div className={cx("acc md:hidden", open && "open", !open && "invisible")}>
        <div>
          <div className="grid gap-1 border-t border-gold/15 px-[5vw] py-3">
            {[...PAGES.map((s): [string, string] => [`/${s}`, label(s)]), ...account].map(([h, t]) => (
              <Link key={h} href={h} className={cx("rounded px-3 py-2.5 text-sm transition hover:bg-gold/10", path === h ? "bg-gold/10 text-gold" : "text-cream/80")}>{t}</Link>
            ))}
            {user ? <button className="rounded px-3 py-2.5 text-left text-sm text-cream/80 hover:bg-gold/10" onClick={signOut}>Logout</button>
              : <div className="px-3 pt-2"><LinkButton href="/register" variant="primary" small>Register</LinkButton></div>}
          </div>
        </div>
      </div>
    </nav>
  );
}
