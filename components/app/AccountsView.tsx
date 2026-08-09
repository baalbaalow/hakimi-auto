import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import type { TikTokAccountSummary } from "@/lib/tiktok-login";

type AccountsViewProps = {
  connectedStatus?: "success" | "error" | null;
  tiktokAccount: TikTokAccountSummary | null;
};

export function AccountsView({
  connectedStatus = null,
  tiktokAccount,
}: AccountsViewProps) {
  const isConnected = Boolean(tiktokAccount?.tiktok_open_id);
  const displayName = tiktokAccount?.display_name;

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

      {connectedStatus ? (
        <div
          role="status"
          className={`rounded-[var(--radius)] border px-4 py-3 text-sm ${
            connectedStatus === "success"
              ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
              : "border-rose-300/20 bg-rose-300/10 text-rose-100"
          }`}
        >
          {connectedStatus === "success"
            ? "TikTok account connected."
            : "We couldn't connect TikTok. Please try again."}
        </div>
      ) : null}

      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
              TikTok
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
              {isConnected
                ? `Status: Connected${
                    displayName ? ` as ${displayName}` : ""
                  }. Token details are stored securely and are not shown here.`
                : "Status: Not connected. Connect TikTok to authorize this workspace. Publishing is not enabled yet."}
            </p>
          </div>
          <Badge variant={isConnected ? "success" : "warning"}>
            {isConnected ? "Connected" : "Not connected"}
          </Badge>
        </div>

        <Button href="/api/tiktok/connect" className="mt-5" size="sm">
          {isConnected ? "Reconnect TikTok" : "Connect TikTok"}
        </Button>
      </Card>
    </div>
  );
}
