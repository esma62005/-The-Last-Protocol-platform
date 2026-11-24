"use client";
import jsQR from "jsqr";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";

/** Camera QR scanner (jsQR). Needs HTTPS or localhost for camera access. Calls onScan once per code (3 s debounce). */
export default function QrScanner({ onScan }: { onScan: (code: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const raf = useRef(0);
  const last = useRef({ code: "", at: 0 });
  const cb = useRef(onScan);
  cb.current = onScan;
  const [on, setOn] = useState(false);
  const [error, setError] = useState("");

  const stop = useCallback(() => {
    cancelAnimationFrame(raf.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    if (video.current) video.current.srcObject = null;
    setOn(false);
  }, []);

  const tick = useCallback(() => {
    const v = video.current, c = canvas.current;
    if (v && c && v.readyState === v.HAVE_ENOUGH_DATA && v.videoWidth) {
      const w = Math.min(640, v.videoWidth);
      const h = Math.round((v.videoHeight * w) / v.videoWidth);
      c.width = w; c.height = h;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(v, 0, 0, w, h);
        const hit = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: "dontInvert" });
        const now = Date.now();
        if (hit?.data && (hit.data !== last.current.code || now - last.current.at > 3000)) {
          last.current = { code: hit.data, at: now };
          cb.current(hit.data);
        }
      }
    }
    raf.current = requestAnimationFrame(tick);
  }, []);

  const start = async () => {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access needs HTTPS (or localhost). Use the manual field below.");
      return;
    }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      if (video.current) {
        video.current.srcObject = stream.current;
        await video.current.play();
      }
      setOn(true);
      raf.current = requestAnimationFrame(tick);
    } catch {
      stop();
      setError("Could not open the camera. Allow camera access in the browser, or use the manual field below.");
    }
  };

  useEffect(() => stop, [stop]);

  return (
    <div className="grid gap-3">
      <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-lg border border-gold/30 bg-ink">
        <video ref={video} muted playsInline className="h-full w-full object-cover" />
        <canvas ref={canvas} className="hidden" />
        {!on && <div className="absolute inset-0 grid place-items-center font-mono text-xs text-muted">Camera off</div>}
        {on && <i className="qr-scan" />}
      </div>
      {error && <p className="text-center text-sm text-rose">⚠ {error}</p>}
      <div className="text-center">
        {on ? <Button small variant="danger" onClick={stop}>Stop camera</Button> : <Button small variant="primary" onClick={start}>Start scanner</Button>}
      </div>
    </div>
  );
}
