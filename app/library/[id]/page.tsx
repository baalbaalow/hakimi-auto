import {
  CalendarDays,
  Clock3,
  FileVideo,
  Library,
  LockKeyhole,
  UserRound,
} from "lucide-react";
import { notFound } from "next/navigation";
import { AppPageHeader } from "@/components/app/AppPageHeader";
import { DraftMetadataForm } from "@/components/app/DraftMetadataForm";
import { DraftReadinessCard } from "@/components/app/DraftReadinessCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getDraftReadiness } from "@/lib/draft-readiness";
import { isUuid } from "@/lib/identifiers";
import { getTikTokAccountSummary } from "@/lib/tiktok-login";
import { createClient } from "@/utils/supabase/server";

const VIDEO_BUCKET = "videos";
const SIGNED_URL_EXPIRES_IN_SECONDS = 30 * 60;

type DraftDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DraftDetailPage({ params }: DraftDetailPageProps) {
  const user = await requireAuthenticatedUser();
  const { id } = await params;

  if (!isUuid(id)) {
    notFound();
  }

  const supabase = await createClient();
  const [uploadResult, tiktokAccount] = await Promise.all([
    supabase
      .from("uploads")
      .select(
        "id, title, caption, status, created_at, updated_at, storage_path",
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
    getTikTokAccountSummary(user.id),
  ]);

  if (uploadResult.error || !uploadResult.data) {
    notFound();
  }

  const upload = uploadResult.data;
  const ownedStoragePath =
    upload.storage_path?.startsWith(`${user.id}/`) === true
      ? upload.storage_path
      : null;
  let signedUrl: string | null = null;

  if (ownedStoragePath) {
    const { data: signedData } = await supabase.storage
      .from(VIDEO_BUCKET)
      .createSignedUrl(ownedStoragePath, SIGNED_URL_EXPIRES_IN_SECONDS);

    signedUrl = signedData?.signedUrl ?? null;
  }

  const tiktokConnected = Boolean(tiktokAccount?.tiktok_open_id);
  const readiness = getDraftReadiness(
    {
      status: upload.status,
      storage_path: ownedStoragePath,
      title: upload.title,
      caption: upload.caption,
    },
    tiktokConnected,
  );
  const isDraft = upload.status === "draft";
  const displayTitle = upload.title?.trim() || "Untitled draft";
  const storageState = getStorageState({
    hasStoredPath: Boolean(upload.storage_path),
    hasOwnedPath: Boolean(ownedStoragePath),
    hasSignedPreview: Boolean(signedUrl),
  });

  return (
    <div className="space-y-6">
      <AppPageHeader
        eyebrow="Library detail"
        title={displayTitle}
        description="Review the private video, update draft metadata, and check publishing readiness."
        actions={
          <>
            <Badge variant={isDraft ? "warning" : getStatusVariant(upload.status)}>
              {formatStatus(upload.status)}
            </Badge>
            <Button href="/library" variant="secondary">
              <Library size={16} aria-hidden="true" />
              Back to library
            </Button>
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.12fr)_minmax(22rem,0.88fr)]">
        <Card className="overflow-hidden">
          <div className="border-b border-white/[0.08] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
                  Private preview
                </p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                  Video file
                </h2>
              </div>
              <Badge variant={signedUrl ? "success" : "warning"}>
                {storageState}
              </Badge>
            </div>
          </div>

          <div className="aspect-video bg-black/55">
            {signedUrl ? (
              <video
                src={signedUrl}
                className="h-full w-full object-contain"
                controls
                playsInline
                preload="metadata"
              />
            ) : (
              <div className="flex h-full min-h-72 flex-col items-center justify-center gap-3 px-6 text-center text-[var(--muted)]">
                <FileVideo size={34} aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-[var(--muted-strong)]">
                    Preview unavailable
                  </p>
                  <p className="mt-1 text-xs leading-5">
                    The private video could not be opened with a temporary signed URL.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-start gap-3 border-t border-white/[0.08] p-4 text-sm text-[var(--muted)]">
            <LockKeyhole
              size={17}
              className="mt-0.5 shrink-0 text-emerald-200"
              aria-hidden="true"
            />
            <p className="leading-6">
              This preview uses a temporary signed URL. The videos bucket remains private.
            </p>
          </div>
        </Card>

        <DraftReadinessCard readiness={readiness} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
        {isDraft ? (
          <DraftMetadataForm
            uploadId={upload.id}
            initialTitle={upload.title}
            initialCaption={upload.caption}
          />
        ) : (
          <Card className="p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
              Metadata
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
              Read-only details
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Only records in draft status can be edited.
            </p>
            <dl className="mt-6 space-y-5">
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                  Title
                </dt>
                <dd className="mt-2 text-sm font-medium text-[var(--foreground)]">
                  {upload.title?.trim() || "Not provided"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                  Caption
                </dt>
                <dd className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--muted-strong)]">
                  {upload.caption?.trim() || "Not provided"}
                </dd>
              </div>
            </dl>
          </Card>
        )}

        <Card className="p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
            Record details
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
            Current state
          </h2>
          <dl className="mt-5 space-y-3">
            <DetailRow
              icon={FileVideo}
              label="File storage"
              value={storageState}
            />
            <DetailRow
              icon={UserRound}
              label="TikTok account"
              value={
                tiktokConnected
                  ? tiktokAccount?.display_name
                    ? `Connected as ${tiktokAccount.display_name}`
                    : "Connected"
                  : "Not connected"
              }
            />
            <DetailRow
              icon={CalendarDays}
              label="Created"
              value={formatDateTime(upload.created_at)}
            />
            <DetailRow
              icon={Clock3}
              label="Updated"
              value={formatDateTime(upload.updated_at)}
            />
          </dl>
        </Card>
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileVideo;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-[var(--radius)] border border-white/[0.07] bg-white/[0.025] p-3">
      <Icon
        size={17}
        className="mt-0.5 shrink-0 text-emerald-200"
        aria-hidden="true"
      />
      <div className="min-w-0">
        <dt className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
          {label}
        </dt>
        <dd className="mt-1 break-words text-sm text-[var(--muted-strong)]">
          {value}
        </dd>
      </div>
    </div>
  );
}

function getStorageState({
  hasStoredPath,
  hasOwnedPath,
  hasSignedPreview,
}: {
  hasStoredPath: boolean;
  hasOwnedPath: boolean;
  hasSignedPreview: boolean;
}) {
  if (!hasStoredPath) {
    return "Video not stored";
  }

  if (!hasOwnedPath) {
    return "Storage check failed";
  }

  return hasSignedPreview ? "Stored privately" : "Preview unavailable";
}

function getStatusVariant(status: string) {
  if (status === "published") {
    return "success" as const;
  }

  if (status === "failed") {
    return "danger" as const;
  }

  if (status === "queued" || status === "processing") {
    return "accent" as const;
  }

  return "neutral" as const;
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
