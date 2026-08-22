"use client";

import { Clock3, Loader2, RefreshCw } from "lucide-react";
import { useActionState } from "react";
import {
  checkTikTokStatus,
  type CheckTikTokStatusState,
} from "@/app/library/[id]/status-actions";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";

const INITIAL_STATUS_STATE: CheckTikTokStatusState = {
  status: "idle",
  message: null,
  revision: 0,
};

export function TikTokPublishStatus({
  uploadId,
  localStatus,
  storedStatusMessage,
}: {
  uploadId: string;
  localStatus: string;
  storedStatusMessage: string | null;
}) {
  const boundAction = checkTikTokStatus.bind(null, uploadId);
  const [actionState, formAction, isPending] = useActionState(
    boundAction,
    INITIAL_STATUS_STATE,
  );
  const canCheck = localStatus === "queued" || localStatus === "processing";
  const displayMessage = actionState.message ?? storedStatusMessage;
  const displayStatus = actionState.message
    ? actionState.status
    : localStatus === "published" || localStatus === "failed"
      ? localStatus
      : "idle";
  const statusHeading = getStatusHeading(localStatus);
  const statusDescription = getStatusDescription(localStatus);

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius)] border border-emerald-300/20 bg-emerald-300/10 text-emerald-200">
            <Clock3 size={18} aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
              TikTok publishing status
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
              {statusHeading}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              {statusDescription}
            </p>
          </div>
        </div>

        {canCheck ? (
          <form action={formAction}>
            <Button
              type="submit"
              variant="secondary"
              disabled={isPending}
              className="w-full sm:w-auto"
            >
              {isPending ? (
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCw size={16} aria-hidden="true" />
              )}
              {isPending ? "Checking TikTok..." : "Check TikTok Status"}
            </Button>
          </form>
        ) : null}
      </div>

      {displayMessage ? (
        <div
          key={actionState.revision}
          role="status"
          className={`mt-4 rounded-[var(--radius)] border p-3 text-sm leading-6 ${getResultClasses(
            displayStatus,
          )}`}
        >
          {displayMessage}
        </div>
      ) : null}
    </Card>
  );
}

function getStatusHeading(localStatus: string) {
  if (localStatus === "published") {
    return "Published on TikTok";
  }

  if (localStatus === "failed") {
    return "TikTok publishing failed";
  }

  return "Check processing progress";
}

function getStatusDescription(localStatus: string) {
  if (localStatus === "published") {
    return "TikTok has confirmed the final published state.";
  }

  if (localStatus === "failed") {
    return "Review the safe processing reason below before preparing another draft.";
  }

  return "Request the latest status once. Hakimi Auto does not poll TikTok automatically.";
}

function getResultClasses(status: CheckTikTokStatusState["status"]) {
  if (status === "published") {
    return "border-emerald-300/20 bg-emerald-300/[0.07] text-emerald-100";
  }

  if (status === "failed" || status === "error") {
    return "border-rose-300/20 bg-rose-300/[0.07] text-rose-100";
  }

  if (status === "unchanged") {
    return "border-amber-300/20 bg-amber-300/[0.07] text-amber-100";
  }

  return "border-sky-300/20 bg-sky-300/[0.07] text-sky-100";
}
