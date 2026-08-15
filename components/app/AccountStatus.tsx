import { Link2, ShieldCheck } from "lucide-react";
import { TikTokConnectLink } from "@/components/app/TikTokConnectLink";
import { Badge } from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import type { TikTokAccountSummary } from "@/lib/tiktok-login";

type AccountStatusProps = {
  tiktokAccount: TikTokAccountSummary | null;
};

export function AccountStatus({ tiktokAccount }: AccountStatusProps) {
  const isConnected = Boolean(tiktokAccount?.tiktok_open_id);
  const displayName = tiktokAccount?.display_name;

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius)] border border-white/[0.1] bg-white/[0.045] text-emerald-200">
            <Link2 size={19} aria-hidden="true" />
          </div>
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
        </div>
        <Badge variant={isConnected ? "success" : "warning"}>
          {isConnected ? "Connected" : "Not connected"}
        </Badge>
      </div>

      <div className="mt-5 grid gap-3 border-t border-white/[0.08] pt-5 sm:grid-cols-2">
        <div className="rounded-[var(--radius)] border border-white/[0.07] bg-white/[0.025] px-3 py-3">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
            OAuth
          </p>
          <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
            {isConnected ? "Authorized" : "Not authorized"}
          </p>
        </div>
        <div className="rounded-[var(--radius)] border border-white/[0.07] bg-white/[0.025] px-3 py-3">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
            Token storage
          </p>
          <p className="mt-1 flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
            {isConnected ? (
              <ShieldCheck
                size={14}
                className="text-emerald-200"
                aria-hidden="true"
              />
            ) : null}
            {isConnected ? "Stored securely" : "None stored"}
          </p>
        </div>
      </div>

      <TikTokConnectLink className="mt-5">
        {isConnected ? "Reconnect TikTok" : "Connect TikTok"}
      </TikTokConnectLink>
    </Card>
  );
}
