import { Badge } from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

export function AccountStatus() {
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--muted-strong)]">
            TikTok account
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
            Not connected
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
            TikTok connection metadata is ready in the database, but OAuth is intentionally not implemented in this phase.
          </p>
        </div>
        <Badge variant="warning">Not connected</Badge>
      </div>

      <button
        type="button"
        disabled
        className="mt-5 inline-flex h-10 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-white/[0.04] px-3 text-sm font-medium text-[var(--muted)] opacity-70"
      >
        Connect TikTok
      </button>
    </Card>
  );
}
