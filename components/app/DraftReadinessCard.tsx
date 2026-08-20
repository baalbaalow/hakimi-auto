import { AlertCircle, CheckCircle2, Circle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import type { DraftReadiness } from "@/lib/draft-readiness";

type DraftReadinessCardProps = {
  readiness: DraftReadiness;
};

export function DraftReadinessCard({ readiness }: DraftReadinessCardProps) {
  const tiktokCheck = readiness.checks.find((check) => check.key === "tiktok");
  const needsTikTok = Boolean(tiktokCheck && !tiktokCheck.ready);
  const needsTikTokReconnect =
    tiktokCheck?.message === "Reconnect TikTok to authorize direct publishing.";

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
            Publishing readiness
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
            {readiness.ready ? "Ready" : "Needs attention"}
          </h2>
        </div>
        <Badge variant={readiness.ready ? "success" : "warning"}>
          {readiness.ready ? "READY" : "NEEDS ATTENTION"}
        </Badge>
      </div>

      <div
        className={`mt-5 flex gap-3 rounded-[var(--radius)] border p-4 ${
          readiness.ready
            ? "border-emerald-300/20 bg-emerald-300/10"
            : "border-amber-300/20 bg-amber-300/10"
        }`}
      >
        {readiness.ready ? (
          <CheckCircle2
            size={20}
            className="mt-0.5 shrink-0 text-emerald-200"
            aria-hidden="true"
          />
        ) : (
          <AlertCircle
            size={20}
            className="mt-0.5 shrink-0 text-amber-200"
            aria-hidden="true"
          />
        )}
        <p className="text-sm leading-6 text-[var(--muted-strong)]">
          {readiness.ready
            ? "Draft is ready for the TikTok publishing integration."
            : "Complete the items below before publishing."}
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {readiness.checks.map((check) => (
          <div
            key={check.key}
            className="rounded-[var(--radius)] border border-white/[0.07] bg-white/[0.025] px-3.5 py-3"
          >
            <div className="flex items-center gap-3">
              {check.ready ? (
                <CheckCircle2
                  size={17}
                  className="shrink-0 text-emerald-200"
                  aria-hidden="true"
                />
              ) : (
                <Circle
                  size={17}
                  className="shrink-0 text-amber-200"
                  aria-hidden="true"
                />
              )}
              <span className="text-sm font-medium text-[var(--foreground)]">
                {check.label}
              </span>
              <span
                className={`ml-auto text-xs font-medium ${
                  check.ready ? "text-emerald-200" : "text-amber-200"
                }`}
              >
                {check.ready ? "Complete" : "Required"}
              </span>
            </div>
            {check.message ? (
              <p className="ml-7 mt-1 text-xs leading-5 text-[var(--muted)]">
                {check.message}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      {needsTikTok ? (
        <div className="mt-5 flex flex-col gap-3 rounded-[var(--radius)] border border-amber-300/20 bg-amber-300/[0.07] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-amber-100">
              {needsTikTokReconnect
                ? "TikTok publishing permission required"
                : "TikTok account required"}
            </p>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
              {needsTikTokReconnect
                ? "Reconnect your account to authorize direct publishing."
                : "Connect your account from the Accounts page."}
            </p>
          </div>
          <Button href="/accounts" variant="secondary" size="sm">
            {needsTikTokReconnect ? "Reconnect TikTok" : "Connect TikTok"}
          </Button>
        </div>
      ) : null}

      <p className="mt-5 text-xs leading-5 text-[var(--muted)]">
        Authorization readiness only. No Content Posting API request is made here.
      </p>
    </Card>
  );
}
