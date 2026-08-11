import { Bot, Link2, Upload } from "lucide-react";

const features = [
  {
    title: "Connect TikTok",
    description: "Authorize a creator account from the workspace without exposing token details.",
    icon: Link2,
  },
  {
    title: "Prepare drafts",
    description: "Organize video files, captions, and readiness checks in one focused flow.",
    icon: Upload,
  },
  {
    title: "Track operations",
    description: "Keep draft, publishing, and account states visible as the backend expands.",
    icon: Bot,
  },
];

export function Features() {
  return (
    <section id="features" className="border-y border-white/[0.08] bg-white/[0.025] py-20">
      <div className="ha-container">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-200">
            Features
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-normal text-[var(--foreground)] sm:text-4xl">
            A cleaner control plane for TikTok operations.
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
                <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius)] border border-white/[0.1] bg-white/[0.055] text-emerald-200">
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
