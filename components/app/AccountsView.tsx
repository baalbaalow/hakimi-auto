import { Badge } from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

export function AccountsView() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-200">
          Accounts
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--foreground)]">
          Connected accounts
        </h1>
      </div>

      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
              TikTok
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
              Status: Not connected. This page will show TikTok display name, avatar, reconnect, and disconnect controls after OAuth is implemented.
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
    </div>
  );
}
