import { Activity, Clock3, Library, UploadCloud, Video } from "lucide-react";
import { AccountStatus } from "@/components/app/AccountStatus";
import { AppPageHeader } from "@/components/app/AppPageHeader";
import { MetricCard } from "@/components/app/MetricCard";
import {
  RecentUploads,
  type RecentUpload,
} from "@/components/app/RecentUploads";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import type { TikTokAccountSummary } from "@/lib/tiktok-login";

type UploadCounts = {
  all: number;
  draft: number;
  queued: number;
  processing: number;
  published: number;
  failed: number;
};

type DashboardOverviewProps = {
  email?: string;
  tiktokAccount: TikTokAccountSummary | null;
  uploadCounts: UploadCounts;
  recentUploads: RecentUpload[];
  uploadsLoadError: string | null;
};

export function DashboardOverview({
  email,
  tiktokAccount,
  uploadCounts,
  recentUploads,
  uploadsLoadError,
}: DashboardOverviewProps) {
  const isConnected = Boolean(tiktokAccount?.tiktok_open_id);
  const activeUploadCount = uploadCounts.queued + uploadCounts.processing;

  return (
    <div className="space-y-6">
      <AppPageHeader
        eyebrow="Creator operations"
        title="Workspace overview"
        description={
          email
            ? `Signed in as ${email}. Monitor account readiness, drafts, and publishing activity from one place.`
            : "Monitor account readiness, drafts, and publishing activity from one place."
        }
        actions={
          <>
            <Button href="/library" variant="secondary">
              <Library size={16} aria-hidden="true" />
              Library
            </Button>
            <Button href="/upload">
              <UploadCloud size={16} aria-hidden="true" />
              Upload video
            </Button>
          </>
        }
      />

      <section className="panel-gradient overflow-hidden rounded-[var(--radius)] border border-[var(--border)] p-5 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_22rem] lg:items-center">
          <div>
            <p className="text-sm font-medium text-emerald-100">
              Today at a glance
            </p>
            <h2 className="mt-2 max-w-3xl text-2xl font-semibold text-[var(--foreground)] sm:text-3xl">
              Your publishing workspace is ready for draft preparation.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted-strong)]">
              Connect TikTok, upload videos, and keep draft status visible as the
              publishing layer comes online.
            </p>
          </div>
          <div className="rounded-[var(--radius)] border border-white/[0.1] bg-black/15 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-[var(--muted)]">Connection state</span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  isConnected
                    ? "bg-emerald-300/10 text-emerald-200"
                    : "bg-amber-300/10 text-amber-200"
                }`}
              >
                {isConnected ? "TikTok connected" : "Action needed"}
              </span>
            </div>
            <div className="mt-4 h-2 rounded-full bg-white/[0.08]">
              <div
                className={`h-2 rounded-full ${
                  isConnected ? "w-full bg-emerald-300" : "w-1/2 bg-amber-300"
                }`}
              />
            </div>
            <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
              Account authorization is the first step before publishing can be
              enabled.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="TikTok account"
          value={isConnected ? "Ready" : "Pending"}
          detail={isConnected ? "OAuth connection detected." : "Connect an account to continue."}
          icon={Activity}
          tone={isConnected ? "emerald" : "amber"}
        />
        <MetricCard
          label="Draft uploads"
          value={String(uploadCounts.draft)}
          detail="Private drafts saved in your library."
          icon={Video}
        />
        <MetricCard
          label="Saved uploads"
          value={String(uploadCounts.all)}
          detail="Total real upload records for this workspace."
          icon={UploadCloud}
        />
        <MetricCard
          label="Publishing"
          value="Not enabled"
          detail="Content Posting API has not been implemented yet."
          icon={Clock3}
          tone="amber"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <AccountStatus tiktokAccount={tiktokAccount} />
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-[var(--muted-strong)]">
                Library activity
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
                {activeUploadCount > 0
                  ? `${activeUploadCount} active upload${activeUploadCount === 1 ? "" : "s"}`
                  : uploadCounts.draft > 0
                    ? `${uploadCounts.draft} draft${uploadCounts.draft === 1 ? "" : "s"} saved`
                    : "No active uploads"}
              </h2>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius)] border border-white/[0.1] bg-white/[0.045] text-amber-200">
              <Activity size={18} aria-hidden="true" />
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Counts below come from your saved upload records. Publishing remains
            unavailable until the Content Posting API phase.
          </p>
          <div className="mt-5 space-y-3">
            {[
              ["Drafts", String(uploadCounts.draft)],
              ["Queued", String(uploadCounts.queued)],
              ["Processing", String(uploadCounts.processing)],
              ["Failed", String(uploadCounts.failed)],
              ["Published", String(uploadCounts.published)],
            ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-[var(--radius)] border border-white/[0.07] bg-white/[0.025] px-3 py-2.5"
                >
                  <span className="h-2 w-2 rounded-full bg-[var(--muted)]" />
                  <span className="text-sm text-[var(--muted-strong)]">
                    {label}
                  </span>
                  <span className="ml-auto text-xs text-[var(--muted)]">
                    {value}
                  </span>
                </div>
              ))}
          </div>
        </Card>
      </div>

      <RecentUploads uploads={recentUploads} loadError={uploadsLoadError} />
    </div>
  );
}
