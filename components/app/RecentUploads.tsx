import { CalendarDays, FileVideo, UploadCloud } from "lucide-react";
import { EmptyState } from "@/components/app/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export type RecentUpload = {
  id: string;
  title: string | null;
  status: string;
  created_at: string | null;
};

type RecentUploadsProps = {
  uploads: RecentUpload[];
  loadError: string | null;
};

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "accent";

export function RecentUploads({ uploads, loadError }: RecentUploadsProps) {
  return (
    <Card>
      <div className="flex flex-col gap-4 border-b border-white/[0.08] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Recent uploads
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Latest videos saved in your library.
          </p>
        </div>
        <Button href="/upload" variant="secondary" size="sm">
          <UploadCloud size={15} aria-hidden="true" />
          Upload video
        </Button>
      </div>
      <div className="hidden grid-cols-[1.2fr_1fr_7rem_8rem] gap-3 border-b border-white/[0.08] px-5 py-3 text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted)] sm:grid">
        <span>Video</span>
        <span>Source</span>
        <span>Status</span>
        <span>Created</span>
      </div>

      {loadError ? (
        <p className="p-5 text-sm text-rose-100">{loadError}</p>
      ) : uploads.length > 0 ? (
        <div className="divide-y divide-white/[0.07]">
          {uploads.map((upload) => (
            <div
              key={upload.id}
              className="grid gap-3 px-5 py-4 sm:grid-cols-[1.2fr_1fr_7rem_8rem] sm:items-center"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                  {upload.title || "Untitled draft"}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Saved library record
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                <FileVideo size={15} aria-hidden="true" />
                Private upload
              </div>
              <div>
                <Badge variant={getStatusVariant(upload.status)}>
                  {formatStatus(upload.status)}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                <CalendarDays size={15} aria-hidden="true" />
                <span>{formatDate(upload.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-5">
          <EmptyState
            icon={FileVideo}
            title="No uploads yet"
            description="Upload your first video when you are ready to save a draft."
          />
        </div>
      )}
    </Card>
  );
}

function getStatusVariant(status: string): BadgeTone {
  if (status === "draft") {
    return "warning";
  }

  if (status === "published") {
    return "success";
  }

  if (status === "failed") {
    return "danger";
  }

  if (status === "queued" || status === "processing") {
    return "accent";
  }

  return "neutral";
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string | null) {
  if (!value) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
