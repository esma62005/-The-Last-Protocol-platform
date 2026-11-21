/* eslint-disable @next/next/no-img-element */
/** CYWORK logo (transparent WebP in /public/logo.webp, aspect 900x786). `size` = width in px. */
export default function Logo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return <img src="/logo.webp" alt="CYWORK" width={size} height={Math.round(size * 0.873)} className={className} draggable={false} />;
}
