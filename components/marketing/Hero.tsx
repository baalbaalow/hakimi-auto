import { ArrowDown, ArrowRight } from "lucide-react";
import { HeroBackground } from "@/components/effects/HeroBackground";
import { Button } from "@/components/ui/Button";
import { homeCopy } from "@/lib/brand";

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-16 pt-20 sm:pt-24 lg:pb-20 lg:pt-28">
      <HeroBackground />
      <div className="ha-container relative z-10 text-center">
        <p className="mx-auto inline-flex rounded-full border border-white/[0.1] bg-white/[0.06] px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-cyan-100">
          {homeCopy.eyebrow}
        </p>
        <h1 className="mx-auto mt-6 max-w-4xl text-balance text-5xl font-semibold leading-[1.02] tracking-normal text-[var(--foreground)] sm:text-6xl lg:text-7xl">
          Publish smarter.
          <span className="block text-[var(--muted-strong)]">
            Automate the rest.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-8 text-[var(--muted)] sm:text-lg">
          {homeCopy.description}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button href="/login">
            {homeCopy.primaryCta}
            <ArrowRight size={16} aria-hidden="true" />
          </Button>
          <Button href="/#how-it-works" variant="secondary">
            {homeCopy.secondaryCta}
            <ArrowDown size={16} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </section>
  );
}
