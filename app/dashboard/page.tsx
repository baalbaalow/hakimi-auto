import { DashboardOverview } from "@/components/app/DashboardOverview";
import { requireAuthenticatedUser } from "@/lib/auth";
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
  const tiktokAccount = await getTikTokAccountSummary(user.id);
  const { data: uploads, error: uploadsError } = await supabase
    .from("uploads")
    .select("id, title, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

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

  return (
    <DashboardOverview
      email={user.email}
      tiktokAccount={tiktokAccount}
      uploadCounts={uploadCounts}
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
