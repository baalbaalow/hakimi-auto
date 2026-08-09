import { Activity, UploadCloud } from "lucide-react";
import { AccountStatus } from "@/components/app/AccountStatus";
import { RecentUploads } from "@/components/app/RecentUploads";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";

type DashboardOverviewProps = {
  email?: string;
};

export function DashboardOverview({ email }: DashboardOverviewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-200">
            Creator workspace
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-[var(--foreground)]">
            Welcome
          </h1>
          {email ? (
            <p className="mt-2 text-sm text-[var(--muted)]">Signed in as {email}</p>
          ) : null}
        </div>
        <Button href="/upload">
          <UploadCloud size={16} aria-hidden="true" />
          Upload video
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <AccountStatus />
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-[var(--muted-strong)]">
                Current activity
              </p>
              <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                No active jobs
              </h2>
            </div>
            <Activity size={20} className="text-[var(--muted)]" aria-hidden="true" />
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Publishing activity will appear after uploads and TikTok publishing are connected.
          </p>
        </Card>
      </div>

      <RecentUploads />
    </div>
  );
}
