"use client";
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Logo from "./Logo";

type Navigate = (href: string, replace?: boolean) => void;
type Phase = "idle" | "in" | "out";
const Ctx = createContext<Navigate>(() => {});

/** Use instead of router.push to get the transition. */
export const useNavigate = () => useContext(Ctx);

/**
 * Sequence:  cover (red wipe + logo)  →  route changes UNDER the cover  →  cover leaves
 * and the new page animates in right behind it. The cover waits for the new route, so the
 * old page is never revealed again.  `html.covered` pauses page animations until the cover leaves.
 */
export default function Transitions({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  pathRef.current = pathname;
  const busy = useRef(false);
  const waiting = useRef(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [label, setLabel] = useState("");
  const cls = () => document.documentElement.classList;

  const finish = useCallback(() => {
    waiting.current = false; busy.current = false;
    cls().remove("covered");
    setPhase("idle");
  }, []);

  const navigate = useCallback<Navigate>((href, replace = false) => {
    const url = new URL(href, location.href);
    const go = () => (replace ? router.replace(href) : router.push(href));
    if (url.pathname === pathRef.current) return go(); // same page (#anchor): no transition
    if (busy.current) return;
    busy.current = true; waiting.current = true;
    setLabel(url.pathname.split("/")[1] || "home");
    setPhase("in");
    cls().add("covered");
    router.prefetch(url.pathname);
    setTimeout(go, 450);                                                    // screen fully covered → swap route
    setTimeout(() => { if (waiting.current) { waiting.current = false; setPhase("out"); } }, 4000); // safety
  }, [router]);

  // new route is mounted (still hidden) → let the cover leave
  useEffect(() => {
    if (!waiting.current) return;
    waiting.current = false;
    setTimeout(() => setPhase("out"), 220);
  }, [pathname]);

  useEffect(() => {
    if (phase !== "out") return;
    const a = setTimeout(() => cls().remove("covered"), 100); // page content starts animating as the cover slides away
    const b = setTimeout(finish, 900);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [phase, finish]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element).closest("a");
      if (!a || a.target || a.hasAttribute("download")) return;
      const u = new URL(a.href, location.href);
      if (u.origin !== location.origin || u.pathname === pathRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      navigate(u.pathname + u.search + u.hash);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [navigate]);

  return (
    <Ctx.Provider value={navigate}>
      {phase !== "idle" && (
        <div className={`wipe ${phase}`} aria-hidden onAnimationEnd={(e) => { if (e.animationName === "wipeOut") finish(); }}>
          <div className="wipe-box">
            <Logo size={120} className="wipe-logo" />
            <div className="wipe-bar"><i /></div>
            <span className="wipe-label">ACCESSING // {label.toUpperCase()}</span>
          </div>
        </div>
      )}
      {children}
    </Ctx.Provider>
  );
}

/** Re-mounts on every route change so the content animates in (staggered). */
export function PageEnter({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return <div key={pathname} className="page-enter">{children}</div>;
}
