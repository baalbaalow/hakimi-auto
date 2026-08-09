import { Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { brand } from "@/lib/brand";

export default function ContactPage() {
  return (
    <main className="py-20">
      <div className="ha-container">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-cyan-200">
            Contact
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-normal text-[var(--foreground)]">
            Get in touch
          </h1>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            For support, onboarding questions, or product feedback, reach the Hakimi Auto team by email.
          </p>
        </div>

        <Card className="mt-10 max-w-2xl p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius)] border border-white/[0.1] bg-white/[0.06] text-cyan-200">
                <Mail size={18} aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm text-[var(--muted)]">Email</p>
                <p className="font-medium text-[var(--foreground)]">
                  {brand.contactEmail}
                </p>
              </div>
            </div>
            <Button href={`mailto:${brand.contactEmail}`} variant="secondary">
              Send email
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
