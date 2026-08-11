import { Activity, Clock3, Library, UploadCloud, Video } from "lucide-react";
import { AccountStatus } from "@/components/app/AccountStatus";
import { AppPageHeader } from "@/components/app/AppPageHeader";
import { MetricCard } from "@/components/app/MetricCard";
import { RecentUploads } from "@/components/app/RecentUploads";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import type { TikTokAccountSummary } from "@/lib/tiktok-login";

type DashboardOverviewProps = {
  email?: string;
  tiktokAccount: TikTokAccountSummary | null;
};

export function DashboardOverview({
  email,
  tiktokAccount,
}: DashboardOverviewProps) {
  const isConnected = Boolean(tiktokAccount?.tiktok_open_id);

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
          value="0"
          detail="Draft records will appear after storage is connected."
          icon={Video}
        />
        <MetricCard
          label="Publishing jobs"
          value="0"
          detail="No queued, processing, or published jobs yet."
          icon={UploadCloud}
        />
        <MetricCard
          label="System activity"
          value="Idle"
          detail="No active background work is currently displayed."
          icon={Clock3}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <AccountStatus tiktokAccount={tiktokAccount} />
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-[var(--muted-strong)]">
                Current activity
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
                No active jobs
              </h2>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius)] border border-white/[0.1] bg-white/[0.045] text-amber-200">
              <Activity size={18} aria-hidden="true" />
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Publishing activity will appear after uploads and TikTok publishing are connected.
          </p>
          <div className="mt-5 space-y-3">
            {["Upload selected", "Draft validated", "Publishing queued"].map(
              (item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-[var(--radius)] border border-white/[0.07] bg-white/[0.025] px-3 py-2.5"
                >
                  <span className="h-2 w-2 rounded-full bg-[var(--muted)]" />
                  <span className="text-sm text-[var(--muted-strong)]">
                    {item}
                  </span>
                  <span className="ml-auto text-xs text-[var(--muted)]">
                    Waiting
                  </span>
                </div>
              ),
            )}
          </div>
        </Card>
      </div>

      <RecentUploads />
    </div>
  );
}
