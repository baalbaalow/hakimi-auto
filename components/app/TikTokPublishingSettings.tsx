import {
  AlertCircle,
  Clock3,
  Settings2,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import type { TikTokCreatorInfoResult } from "@/lib/tiktok-content-posting";

type TikTokPublishingSettingsProps = {
  creatorInfoResult: TikTokCreatorInfoResult;
};

export function TikTokPublishingSettings({
  creatorInfoResult,
}: TikTokPublishingSettingsProps) {
  if (!creatorInfoResult.ok) {
    return (
      <CreatorInfoErrorState
        code={creatorInfoResult.code}
        message={creatorInfoResult.message}
      />
    );
  }

  const { creatorInfo } = creatorInfoResult;

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
            TikTok Creator Info
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
            Publishing settings
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            Choose from the latest settings TikTok allows for this creator. No
            publishing request is made on this page.
          </p>
        </div>
        <Badge variant="success">CREATOR INFO READY</Badge>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <div className="space-y-4">
          <section className="rounded-[var(--radius)] border border-white/[0.08] bg-white/[0.025] p-4">
            <div className="flex items-center gap-3">
              {creatorInfo.creatorAvatarUrl ? (
                <div
                  aria-hidden="true"
                  className="h-14 w-14 shrink-0 rounded-full border border-white/[0.12] bg-cover bg-center"
                  style={{
                    backgroundImage: `url("${escapeCssUrl(
                      creatorInfo.creatorAvatarUrl,
                    )}")`,
                  }}
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.05] text-emerald-200">
                  <UserRound size={22} aria-hidden="true" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-[var(--foreground)]">
                  {creatorInfo.creatorNickname}
                </p>
                <p className="mt-1 truncate text-sm text-[var(--muted)]">
                  @{creatorInfo.creatorUsername}
                </p>
              </div>
            </div>
          </section>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <InfoTile
              icon={Clock3}
              label="TikTok maximum duration"
              value={formatDuration(creatorInfo.maxVideoPostDurationSec)}
            />
            <InfoTile
              icon={AlertCircle}
              label="Draft video duration"
              value="Not recorded"
              tone="warning"
            />
          </div>

          <div className="flex gap-3 rounded-[var(--radius)] border border-amber-300/20 bg-amber-300/[0.07] p-4">
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0 text-amber-200"
              aria-hidden="true"
            />
            <p className="text-xs leading-5 text-[var(--muted-strong)]">
              Hakimi Auto does not currently store the draft&apos;s video duration,
              so the TikTok duration limit cannot yet be enforced automatically.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <section>
            <label
              htmlFor="tiktok-privacy-level"
              className="block text-sm font-medium text-[var(--muted-strong)]"
            >
              Privacy level
            </label>
            <select
              id="tiktok-privacy-level"
              name="privacy_level"
              defaultValue=""
              className="focus-ring mt-2 h-11 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[#111511] px-3 text-sm text-[var(--foreground)] outline-none transition hover:border-[var(--border-strong)]"
              aria-describedby="tiktok-privacy-help"
            >
              <option value="" disabled>
                Select a privacy level
              </option>
              {creatorInfo.privacyLevelOptions.map((privacyLevel) => (
                <option key={privacyLevel} value={privacyLevel}>
                  {formatPrivacyLevel(privacyLevel)}
                </option>
              ))}
            </select>
            <p
              id="tiktok-privacy-help"
              className="mt-2 text-xs leading-5 text-[var(--muted)]"
            >
              No privacy level is selected automatically. These are the only
              options returned by TikTok for this creator.
            </p>
          </section>

          <fieldset>
            <legend className="text-sm font-medium text-[var(--muted-strong)]">
              Interaction controls
            </legend>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
              All interactions are off by default. Restrictions from TikTok
              cannot be enabled here.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <InteractionControl
                id="tiktok-allow-comment"
                name="allow_comment"
                label="Allow comments"
                disabled={creatorInfo.commentDisabled}
              />
              <InteractionControl
                id="tiktok-allow-duet"
                name="allow_duet"
                label="Allow Duet"
                disabled={creatorInfo.duetDisabled}
              />
              <InteractionControl
                id="tiktok-allow-stitch"
                name="allow_stitch"
                label="Allow Stitch"
                disabled={creatorInfo.stitchDisabled}
              />
            </div>
          </fieldset>

          <label className="flex cursor-pointer items-start gap-3 rounded-[var(--radius)] border border-white/[0.1] bg-white/[0.035] p-4">
            <input
              type="checkbox"
              name="tiktok_music_usage_consent"
              defaultChecked={false}
              className="focus-ring mt-0.5 h-4 w-4 shrink-0 accent-emerald-400"
            />
            <span>
              <span className="block text-sm font-medium text-[var(--foreground)]">
                Explicit consent
              </span>
              <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
                By posting, you agree to TikTok&apos;s Music Usage Confirmation.
              </span>
            </span>
          </label>

          <div className="flex items-start gap-3 rounded-[var(--radius)] border border-emerald-300/15 bg-emerald-300/[0.06] p-4">
            <ShieldCheck
              size={18}
              className="mt-0.5 shrink-0 text-emerald-200"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-semibold text-emerald-100">
                Phase 4B settings only
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                There is no Publish button. Direct Post initialization and video
                transfer remain disabled.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function CreatorInfoErrorState({
  code,
  message,
}: {
  code: Exclude<TikTokCreatorInfoResult, { ok: true }>["code"];
  message: string;
}) {
  const needsAccountAction =
    code === "not_connected" ||
    code === "missing_publish_scope" ||
    code === "authorization_expired";

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius)] border border-amber-300/20 bg-amber-300/10 text-amber-200">
          <Settings2 size={18} aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">
            TikTok Creator Info
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
            Publishing settings unavailable
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            {message}
          </p>
          {needsAccountAction ? (
            <div className="mt-4">
              <Button href="/accounts" variant="secondary" size="sm">
                {code === "not_connected"
                  ? "Connect TikTok"
                  : "Reconnect TikTok"}
              </Button>
            </div>
          ) : (
            <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
              Refresh this page to request the latest Creator Info again.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

function InteractionControl({
  id,
  name,
  label,
  disabled,
}: {
  id: string;
  name: string;
  label: string;
  disabled: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className={`rounded-[var(--radius)] border p-3 transition ${
        disabled
          ? "cursor-not-allowed border-white/[0.06] bg-white/[0.02] opacity-55"
          : "cursor-pointer border-white/[0.1] bg-white/[0.035] hover:border-white/[0.16]"
      }`}
    >
      <span className="flex items-center gap-2">
        <input
          id={id}
          name={name}
          type="checkbox"
          defaultChecked={false}
          disabled={disabled}
          className="focus-ring h-4 w-4 shrink-0 accent-emerald-400"
        />
        <span className="text-sm font-medium text-[var(--foreground)]">
          {label}
        </span>
      </span>
      <span className="mt-2 block text-xs leading-5 text-[var(--muted)]">
        {disabled ? "Disabled by TikTok settings" : "Available - Off by default"}
      </span>
    </label>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
  tone = "success",
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
  tone?: "success" | "warning";
}) {
  return (
    <div className="rounded-[var(--radius)] border border-white/[0.08] bg-white/[0.025] p-3">
      <div className="flex items-start gap-3">
        <Icon
          size={17}
          className={`mt-0.5 shrink-0 ${
            tone === "success" ? "text-emerald-200" : "text-amber-200"
          }`}
          aria-hidden="true"
        />
        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
            {label}
          </p>
          <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function formatPrivacyLevel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDuration(seconds: number) {
  if (seconds % 60 === 0) {
    const minutes = seconds / 60;
    return `${minutes} minute${minutes === 1 ? "" : "s"} (${seconds} seconds)`;
  }

  return `${seconds} seconds`;
}

function escapeCssUrl(value: string) {
  return value.replace(/["\\]/g, "\\$&");
}
