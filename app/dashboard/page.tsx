import { DashboardOverview } from "@/components/app/DashboardOverview";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getDraftReadiness } from "@/lib/draft-readiness";
import { getTikTokAccountSummary } from "@/lib/tiktok-login";
import { createClient } from "@/utils/supabase/server";

const uploadStatuses = ["draft", "queued", "processing", "published", "failed"] as const;

type UploadStatus = (typeof uploadStatuses)[number];
type UploadCounts = Record<"all" | UploadStatus, number>;

const emptyCounts: UploadCounts = {
  all: 0,
  draft: 0,
  queued: 0,
  processing: 0,
  published: 0,
  failed: 0,
};

export default async function DashboardPage() {
  const user = await requireAuthenticatedUser();
  const supabase = await createClient();
  const [tiktokAccount, uploadsResult] = await Promise.all([
    getTikTokAccountSummary(user.id),
    supabase
      .from("uploads")
      .select("id, title, caption, status, created_at, storage_path")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);
  const { data: uploads, error: uploadsError } = uploadsResult;

  const uploadCounts = (uploads ?? []).reduce(
    (counts, upload) => {
      counts.all += 1;

      if (isUploadStatus(upload.status)) {
        counts[upload.status] += 1;
      }

      return counts;
    },
    { ...emptyCounts },
  );
  const tiktokConnected = Boolean(tiktokAccount?.tiktok_open_id);
  const readyDraftCount = (uploads ?? []).filter((upload) =>
    getDraftReadiness(
      {
        status: upload.status,
        storage_path: upload.storage_path?.startsWith(`${user.id}/`)
          ? upload.storage_path
          : null,
        title: upload.title,
        caption: upload.caption,
      },
      {
        connected: tiktokConnected,
        canPublishDirect: Boolean(tiktokAccount?.canPublishDirect),
      },
    ).ready,
  ).length;

  return (
    <DashboardOverview
      email={user.email}
      tiktokAccount={tiktokAccount}
      uploadCounts={uploadCounts}
      readyDraftCount={readyDraftCount}
      recentUploads={(uploads ?? []).slice(0, 5)}
      uploadsLoadError={uploadsError ? "Upload activity could not be loaded." : null}
    />
  );
}

function isUploadStatus(value: unknown): value is UploadStatus {
  return (
    typeof value === "string" &&
    uploadStatuses.includes(value as UploadStatus)
  );
}
