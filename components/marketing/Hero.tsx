import { ArrowDown, ArrowRight, CheckCircle2 } from "lucide-react";
import { HeroBackground } from "@/components/effects/HeroBackground";
import { Button } from "@/components/ui/Button";
import { homeCopy } from "@/lib/brand";

const proofPoints = [
  "Account authorization",
  "Draft preparation",
  "Publishing visibility",
];

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-12 pt-[4.5rem] sm:pt-[5.5rem] lg:pb-14 lg:pt-24">
      <HeroBackground />
      <div className="ha-container relative z-10 text-center">
        <p className="mx-auto inline-flex rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-emerald-100">
          {homeCopy.eyebrow}
        </p>
        <h1 className="mx-auto mt-6 max-w-4xl text-balance text-5xl font-semibold leading-[1.02] tracking-normal text-[var(--foreground)] sm:text-6xl lg:text-7xl">
          Hakimi Auto
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-8 text-[var(--muted)] sm:text-lg">
          {homeCopy.description}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button href="/login?mode=signup">
            {homeCopy.primaryCta}
            <ArrowRight size={16} aria-hidden="true" />
          </Button>
          <Button href="/#how-it-works" variant="secondary">
            {homeCopy.secondaryCta}
            <ArrowDown size={16} aria-hidden="true" />
          </Button>
        </div>
        <div className="mx-auto mt-8 grid max-w-3xl gap-2 sm:grid-cols-3">
          {proofPoints.map((item) => (
            <div
              key={item}
              className="flex items-center justify-center gap-2 rounded-[var(--radius)] border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-sm text-[var(--muted-strong)]"
            >
              <CheckCircle2 size={15} className="text-emerald-200" aria-hidden="true" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
