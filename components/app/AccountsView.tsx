import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Link2,
  RefreshCw,
} from "lucide-react";
import { DisconnectTikTokForm } from "@/components/app/DisconnectTikTokForm";
import { AppPageHeader } from "@/components/app/AppPageHeader";
import { TikTokConnectLink } from "@/components/app/TikTokConnectLink";
import { Badge } from "@/components/ui/Badge";
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
  const avatarUrl = tiktokAccount?.avatar_url;
  const canPublishDirect = Boolean(tiktokAccount?.canPublishDirect);
  const canUploadDraft = Boolean(tiktokAccount?.canUploadDraft);
  const publishingPermissionsReady =
    isConnected && canPublishDirect && canUploadDraft;
  const needsPublishingReconnect =
    isConnected && !publishingPermissionsReady;
  const reconnectHeading = canPublishDirect
    ? "Reconnect TikTok to authorize video upload permissions."
    : "Reconnect TikTok to authorize video publishing permissions.";
  const reconnectExplanation = canPublishDirect
    ? "Reconnect TikTok to grant Hakimi Auto permission to upload videos."
    : "Reconnect TikTok to grant Hakimi Auto permission to publish videos.";

  return (
    <div className="space-y-6">
      <AppPageHeader
        eyebrow="Accounts"
        title="Connected accounts"
        description="Manage external account authorization for this workspace."
      />

      {connectedStatus ? (
        <div
          role="status"
          className={`flex items-start gap-3 rounded-[var(--radius)] border px-4 py-3 text-sm ${
            connectedStatus === "success"
              ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
              : "border-rose-300/20 bg-rose-300/10 text-rose-100"
          }`}
        >
          {connectedStatus === "success" ? (
            <CheckCircle2 size={18} aria-hidden="true" />
          ) : (
            <AlertCircle size={18} aria-hidden="true" />
          )}
          <span>
            {connectedStatus === "success"
              ? "TikTok account connected."
              : "We couldn't connect TikTok. Please try again."}
          </span>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-4">
              {avatarUrl ? (
                <div
                  aria-hidden="true"
                  className="h-12 w-12 shrink-0 rounded-[var(--radius)] border border-white/[0.1] bg-cover bg-center"
                  style={{
                    backgroundImage: `url("${escapeCssUrl(avatarUrl)}")`,
                  }}
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius)] border border-white/[0.1] bg-white/[0.045] text-emerald-200">
                  <Link2 size={20} aria-hidden="true" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-semibold text-[var(--foreground)]">
                  TikTok
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
                  {isConnected
                    ? publishingPermissionsReady
                      ? `Connected${
                          displayName ? ` as ${displayName}` : ""
                        }. Publishing permissions are ready.`
                      : `Connected${
                          displayName ? ` as ${displayName}` : ""
                        }, but publishing permissions have not been authorized.`
                    : "Not connected. Connect TikTok to authorize Login Kit and content posting permissions for this workspace."}
                </p>
              </div>
            </div>
            <Badge variant={isConnected ? "success" : "warning"}>
              {isConnected ? "Connected" : "Not connected"}
            </Badge>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ["Login Kit", isConnected ? "Authorized" : "Required"],
              [
                "Direct Post",
                getPermissionStatus(canPublishDirect, isConnected),
              ],
              [
                "Upload to TikTok",
                getPermissionStatus(canUploadDraft, isConnected),
              ],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-[var(--radius)] border border-white/[0.07] bg-white/[0.025] px-3 py-3"
              >
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                  {label}
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
                  {value}
                </p>
              </div>
            ))}
          </div>

          {needsPublishingReconnect ? (
            <div className="mt-5 rounded-[var(--radius)] border border-amber-300/20 bg-amber-300/[0.08] p-4">
              <div className="flex items-start gap-3">
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0 text-amber-200"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-semibold text-amber-100">
                    {reconnectHeading}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                    {reconnectExplanation}
                  </p>
                </div>
              </div>
              <TikTokConnectLink className="mt-4" variant="secondary">
                Reconnect TikTok
              </TikTokConnectLink>
            </div>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-start">
            {!needsPublishingReconnect ? (
              <TikTokConnectLink
                className="w-full sm:w-auto"
                variant={isConnected ? "secondary" : "primary"}
              >
                {isConnected ? "Reconnect TikTok" : "Connect TikTok"}
              </TikTokConnectLink>
            ) : null}
            {isConnected ? <DisconnectTikTokForm /> : null}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius)] border border-amber-300/20 bg-amber-300/10 text-amber-200">
              <KeyRound size={17} aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Publishing permissions
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {publishingPermissionsReady
                  ? "Ready"
                  : isConnected
                    ? "Reconnect required"
                    : "Connection required"}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {[
              ["Login Kit", isConnected ? "Authorized" : "Required"],
              [
                "Direct Post",
                getPermissionStatus(canPublishDirect, isConnected),
              ],
              [
                "Upload to TikTok",
                getPermissionStatus(canUploadDraft, isConnected),
              ],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-3 border-b border-white/[0.07] pb-3 last:border-b-0 last:pb-0"
              >
                <span className="text-sm text-[var(--muted)]">{label}</span>
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {value}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-2 rounded-[var(--radius)] border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-xs text-[var(--muted)]">
            <RefreshCw size={14} className="text-[var(--muted-strong)]" aria-hidden="true" />
            {publishingPermissionsReady
              ? "The stored authorization includes Direct Post and upload permissions."
              : isConnected
                ? "Stored connections are not publishing-ready without the required OAuth scopes."
                : "Connect TikTok to request the required OAuth scopes."}
          </div>
        </Card>
      </div>
    </div>
  );
}

function escapeCssUrl(value: string) {
  return value.replace(/["\\]/g, "\\$&");
}

function getPermissionStatus(authorized: boolean, connected: boolean) {
  if (authorized) {
    return "Authorized";
  }

  return connected ? "Reconnect required" : "Required";
}
