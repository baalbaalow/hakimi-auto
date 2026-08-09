import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import type { TikTokAccountSummary } from "@/lib/tiktok-account";

type AccountStatusProps = {
  tiktokAccount: TikTokAccountSummary | null;
};

export function AccountStatus({ tiktokAccount }: AccountStatusProps) {
  const isConnected = Boolean(tiktokAccount?.tiktok_open_id);
  const displayName = tiktokAccount?.display_name;

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--muted-strong)]">
            TikTok account
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
            {isConnected ? "Connected" : "Not connected"}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
            {isConnected
              ? `OAuth is connected${
                  displayName ? ` for ${displayName}` : ""
                }. Publishing remains disabled until the Content Posting API phase.`
              : "Connect TikTok to authorize this workspace. Publishing remains disabled until the Content Posting API phase."}
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
  );
}
