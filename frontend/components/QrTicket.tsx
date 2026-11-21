"use client";
import { QRCodeSVG } from "qrcode.react";

export default function QrTicket({ id }: { id: string }) {
  return (
    <div className="grid place-items-center gap-2">
      <div className="relative overflow-hidden rounded-lg bg-cream p-3 shadow-[0_0_40px_-10px_rgba(197,165,106,.6)]">
        <QRCodeSVG value={id} size={150} bgColor="#E8DFD0" fgColor="#151719" />
        <i className="qr-scan" />
      </div>
      <div className="font-mono text-lg tracking-widest text-gold">{id}</div>
    </div>
  );
}
