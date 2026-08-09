const steps = [
  {
    number: "01",
    title: "Connect",
    description: "Link the creator account once TikTok OAuth is implemented.",
  },
  {
    number: "02",
    title: "Upload",
    description: "Add a video, title, caption, and target account.",
  },
  {
    number: "03",
    title: "Automate",
    description: "Hand repetitive work to the future automation layer.",
  },
  {
    number: "04",
    title: "Publish",
    description: "Track draft, queued, processing, published, or failed states.",
  },
];

export function Workflow() {
  return (
    <section id="how-it-works" className="py-20">
      <div className="ha-container">
        <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-cyan-200">
              How it works
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-normal text-[var(--foreground)] sm:text-4xl">
              A simple publishing flow.
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {steps.map((step) => (
              <article
                key={step.number}
                className="rounded-[var(--radius)] border border-white/[0.1] bg-white/[0.045] p-5"
              >
                <span className="text-xs font-semibold tracking-[0.2em] text-[var(--accent)]">
                  {step.number}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-[var(--foreground)]">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
