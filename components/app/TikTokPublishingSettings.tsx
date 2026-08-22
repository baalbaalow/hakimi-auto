"use client";

import {
  AlertCircle,
  Clock3,
  Settings2,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useActionState, useState } from "react";
import {
  postDraftToTikTok,
  type PublishDraftState,
} from "@/app/library/[id]/publish-actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import type { TikTokCreatorInfoResult } from "@/lib/tiktok-content-posting-types";

const INITIAL_PUBLISH_STATE: PublishDraftState = {
  status: "idle",
  message: null,
  revision: 0,
};

type TikTokPublishingSettingsProps = {
  creatorInfoResult: TikTokCreatorInfoResult;
  uploadId: string;
  draftReady: boolean;
};

export function TikTokPublishingSettings({
  creatorInfoResult,
  uploadId,
  draftReady,
}: TikTokPublishingSettingsProps) {
  if (!creatorInfoResult.ok) {
    return (
      <CreatorInfoErrorState
        code={creatorInfoResult.code}
        message={creatorInfoResult.message}
      />
    );
  }

  return (
    <PublishingSettingsForm
      creatorInfoResult={creatorInfoResult}
      uploadId={uploadId}
      draftReady={draftReady}
    />
  );
}

function PublishingSettingsForm({
  creatorInfoResult,
  uploadId,
  draftReady,
}: {
  creatorInfoResult: Extract<TikTokCreatorInfoResult, { ok: true }>;
  uploadId: string;
  draftReady: boolean;
}) {
  const { creatorInfo } = creatorInfoResult;
  const [privacyLevel, setPrivacyLevel] = useState("");
  const [allowComment, setAllowComment] = useState(false);
  const [allowDuet, setAllowDuet] = useState(false);
  const [allowStitch, setAllowStitch] = useState(false);
  const [contentDisclosure, setContentDisclosure] = useState(false);
  const [brandOrganic, setBrandOrganic] = useState(false);
  const [brandContent, setBrandContent] = useState(false);
  const [isAigc, setIsAigc] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const boundPostAction = postDraftToTikTok.bind(null, uploadId);
  const [actionState, formAction, isPending] = useActionState(
    boundPostAction,
    INITIAL_PUBLISH_STATE,
  );
  const disclosureIncomplete =
    contentDisclosure && !brandOrganic && !brandContent;
  const brandedPrivate = brandContent && privacyLevel === "SELF_ONLY";
  const canSubmit =
    draftReady &&
    Boolean(privacyLevel) &&
    !disclosureIncomplete &&
    !brandedPrivate &&
    consentGiven &&
    !isPending;

  function handleDisclosureChange(checked: boolean) {
    setContentDisclosure(checked);

    if (!checked) {
      setBrandOrganic(false);
      setBrandContent(false);
    }
  }

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
            Review every choice before sending. Hakimi Auto requests fresh
            Creator Info and validates these settings again on the server.
          </p>
        </div>
        <Badge variant="success">CREATOR INFO READY</Badge>
      </div>

      <form action={formAction} className="mt-6">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
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
                  <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
                    TikTok account used for this post
                  </p>
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
                icon={ShieldCheck}
                label="Draft video duration"
                value="Verified server-side before posting"
              />
            </div>

            <div className="flex gap-3 rounded-[var(--radius)] border border-amber-300/20 bg-amber-300/[0.07] p-4">
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0 text-amber-200"
                aria-hidden="true"
              />
              <p className="text-xs leading-5 text-[var(--muted-strong)]">
                Sandbox/unaudited Direct Post testing is restricted to private
                visibility. Choose Self Only only if TikTok returns it above.
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
                value={privacyLevel}
                onChange={(event) => setPrivacyLevel(event.target.value)}
                className="focus-ring mt-2 h-11 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[#111511] px-3 text-sm text-[var(--foreground)] outline-none transition hover:border-[var(--border-strong)]"
                aria-describedby="tiktok-privacy-help"
              >
                <option value="" disabled>
                  Select a privacy level
                </option>
                {creatorInfo.privacyLevelOptions.map((option) => (
                  <option key={option} value={option}>
                    {formatPrivacyLevel(option)}
                  </option>
                ))}
              </select>
              <p
                id="tiktok-privacy-help"
                className="mt-2 text-xs leading-5 text-[var(--muted)]"
              >
                No privacy level is selected automatically. Only options from
                TikTok are shown.
              </p>
            </section>

            <fieldset>
              <legend className="text-sm font-medium text-[var(--muted-strong)]">
                Interaction controls
              </legend>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                All interactions are off by default. Fresh TikTok restrictions
                remain authoritative when the post is sent.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <InteractionControl
                  id="tiktok-allow-comment"
                  name="allow_comment"
                  label="Allow comments"
                  checked={allowComment}
                  onChange={setAllowComment}
                  disabled={creatorInfo.commentDisabled}
                />
                <InteractionControl
                  id="tiktok-allow-duet"
                  name="allow_duet"
                  label="Allow Duet"
                  checked={allowDuet}
                  onChange={setAllowDuet}
                  disabled={creatorInfo.duetDisabled}
                />
                <InteractionControl
                  id="tiktok-allow-stitch"
                  name="allow_stitch"
                  label="Allow Stitch"
                  checked={allowStitch}
                  onChange={setAllowStitch}
                  disabled={creatorInfo.stitchDisabled}
                />
              </div>
            </fieldset>

            <fieldset className="rounded-[var(--radius)] border border-white/[0.1] bg-white/[0.025] p-4">
              <legend className="px-1 text-sm font-medium text-[var(--muted-strong)]">
                Content disclosure
              </legend>
              <CheckboxRow
                id="tiktok-content-disclosure"
                name="content_disclosure"
                checked={contentDisclosure}
                onChange={handleDisclosureChange}
                label="This content promotes myself, a brand, product or service"
              />

              {contentDisclosure ? (
                <div className="mt-4 grid gap-3 border-t border-white/[0.08] pt-4 sm:grid-cols-2">
                  <DisclosureOption
                    id="tiktok-brand-organic"
                    name="brand_organic_toggle"
                    checked={brandOrganic}
                    onChange={setBrandOrganic}
                    label="Your brand"
                    description="Your video will be labeled as 'Promotional content'."
                  />
                  <DisclosureOption
                    id="tiktok-brand-content"
                    name="brand_content_toggle"
                    checked={brandContent}
                    onChange={setBrandContent}
                    label="Branded content"
                    description="Your video will be labeled as 'Paid partnership'."
                  />
                </div>
              ) : null}

              {disclosureIncomplete ? (
                <p className="mt-3 text-xs leading-5 text-amber-200" role="alert">
                  Choose Your brand, Branded content, or both.
                </p>
              ) : null}

              {brandedPrivate ? (
                <p className="mt-3 text-xs leading-5 text-rose-200" role="alert">
                  Branded content cannot use Self Only/private visibility. Keep
                  your privacy choice and turn off Branded content, or choose a
                  different TikTok option.
                </p>
              ) : null}
            </fieldset>

            <div className="rounded-[var(--radius)] border border-white/[0.1] bg-white/[0.025] p-4">
              <CheckboxRow
                id="tiktok-is-aigc"
                name="is_aigc"
                checked={isAigc}
                onChange={setIsAigc}
                label="AI-generated content"
                description="Enable only when this video should carry TikTok's AI-generated label."
              />
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-[var(--radius)] border border-white/[0.1] bg-white/[0.035] p-4">
              <input
                type="checkbox"
                name="tiktok_music_usage_consent"
                checked={consentGiven}
                onChange={(event) => setConsentGiven(event.target.checked)}
                className="focus-ring mt-0.5 h-4 w-4 shrink-0 accent-emerald-400"
              />
              <span>
                <span className="block text-sm font-medium text-[var(--foreground)]">
                  Explicit consent
                </span>
                <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
                  {brandContent
                    ? "By posting, you agree to TikTok's Branded Content Policy and Music Usage Confirmation."
                    : "By posting, you agree to TikTok's Music Usage Confirmation."}
                </span>
              </span>
            </label>

            {!draftReady ? (
              <p className="text-xs leading-5 text-amber-200">
                Resolve every Publishing readiness item before posting.
              </p>
            ) : null}

            {actionState.message ? (
              <div
                key={actionState.revision}
                role="status"
                className={`rounded-[var(--radius)] border p-3 text-sm leading-6 ${
                  actionState.status === "success"
                    ? "border-emerald-300/20 bg-emerald-300/[0.07] text-emerald-100"
                    : "border-rose-300/20 bg-rose-300/[0.07] text-rose-100"
                }`}
              >
                {actionState.message}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 rounded-[var(--radius)] border border-emerald-300/15 bg-emerald-300/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-100">
                  Phase 4C Sandbox Direct Post
                </p>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                  Sends the private file to TikTok with FILE_UPLOAD. After the
                  transfer, use Check TikTok Status on this detail page.
                </p>
              </div>
              <Button
                type="submit"
                disabled={!canSubmit}
                aria-disabled={!canSubmit}
                className="w-full sm:w-auto"
              >
                <ShieldCheck size={17} aria-hidden="true" />
                {isPending ? "Sending to TikTok..." : "Post to TikTok"}
              </Button>
            </div>
          </div>
        </div>
      </form>
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
  checked,
  onChange,
  disabled,
}: {
  id: string;
  name: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
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
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
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

function CheckboxRow({
  id,
  name,
  checked,
  onChange,
  label,
  description,
}: {
  id: string;
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
      <input
        id={id}
        name={name}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="focus-ring mt-0.5 h-4 w-4 shrink-0 accent-emerald-400"
      />
      <span>
        <span className="block text-sm font-medium text-[var(--foreground)]">
          {label}
        </span>
        {description ? (
          <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}

function DisclosureOption({
  id,
  name,
  checked,
  onChange,
  label,
  description,
}: {
  id: string;
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <label
      htmlFor={id}
      className="cursor-pointer rounded-[var(--radius)] border border-white/[0.09] bg-white/[0.03] p-3"
    >
      <span className="flex items-center gap-2">
        <input
          id={id}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="focus-ring h-4 w-4 accent-emerald-400"
        />
        <span className="text-sm font-medium text-[var(--foreground)]">
          {label}
        </span>
      </span>
      <span className="mt-2 block text-xs leading-5 text-[var(--muted)]">
        {description}
      </span>
    </label>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[var(--radius)] border border-white/[0.08] bg-white/[0.025] p-3">
      <div className="flex items-start gap-3">
        <Icon
          size={17}
          className="mt-0.5 shrink-0 text-emerald-200"
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
