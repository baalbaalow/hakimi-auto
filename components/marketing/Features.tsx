import { Bot, Link2, Upload } from "lucide-react";

const features = [
  {
    title: "Connect TikTok",
    description: "Securely connect your creator account when the integration is ready.",
    icon: Link2,
  },
  {
    title: "Upload and Publish",
    description: "Prepare videos and captions from one focused workspace.",
    icon: Upload,
  },
  {
    title: "Automate",
    description: "Reduce repetitive publishing work through a structured automation flow.",
    icon: Bot,
  },
];

export function Features() {
  return (
    <section id="features" className="border-y border-white/[0.08] bg-white/[0.03] py-20">
      <div className="ha-container">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-cyan-200">
            Features
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-normal text-[var(--foreground)] sm:text-4xl">
            The basics, kept clear.
          </h2>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="rounded-[var(--radius)] border border-white/[0.1] bg-[var(--surface)] p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius)] border border-white/[0.1] bg-white/[0.06] text-cyan-200">
                  <Icon size={18} aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-[var(--foreground)]">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
