import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function FinalCTA() {
  return (
    <section className="pb-20">
      <div className="ha-container">
        <div className="panel-gradient overflow-hidden rounded-[var(--radius)] border border-white/[0.1] p-8 sm:p-10">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-normal text-[var(--foreground)] sm:text-4xl">
              Start from a workspace that feels ready for real operations.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
              Start with the workspace today. TikTok publishing and automation integrations will be added in later phases.
            </p>
            <div className="mt-7">
              <Button href="/login">
                Get Started
                <ArrowRight size={16} aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
