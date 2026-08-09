import { AmbientGlow } from "@/components/effects/AmbientGlow";

export function HeroBackground() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <AmbientGlow />
      <div className="hero-grid absolute inset-x-0 top-0 h-[42rem] opacity-70" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[var(--background)] to-transparent" />
    </div>
  );
}
