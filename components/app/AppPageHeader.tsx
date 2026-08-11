type AppPageHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

export function AppPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: AppPageHeaderProps) {
  return (
    <div className="flex flex-col gap-5 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal text-[var(--foreground)] sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
