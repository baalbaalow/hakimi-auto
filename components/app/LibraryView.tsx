"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  FileVideo,
  Loader2,
  Search,
  Settings,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { deleteDraftUpload } from "@/app/library/actions";
import { EmptyState } from "@/components/app/EmptyState";
import { AppPageHeader } from "@/components/app/AppPageHeader";
import { MetricCard } from "@/components/app/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

const filters = ["All", "Draft", "Processing", "Published", "Failed"];

export type LibraryUpload = {
  id: string;
  title: string | null;
  caption: string | null;
  status: string;
  created_at: string | null;
  storage_path: string | null;
  signedUrl: string | null;
};

type LibraryViewProps = {
  initialUploads: LibraryUpload[];
  loadError: string | null;
};

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "accent";

export function LibraryView({ initialUploads, loadError }: LibraryViewProps) {
  const [activeFilter, setActiveFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletedUploadIds, setDeletedUploadIds] = useState<string[]>([]);

  const uploads = useMemo(
    () =>
      initialUploads.filter((upload) => !deletedUploadIds.includes(upload.id)),
    [deletedUploadIds, initialUploads],
  );

  const metrics = useMemo(() => {
    const draftCount = uploads.filter((upload) => upload.status === "draft").length;
    const publishedCount = uploads.filter(
      (upload) => upload.status === "published",
    ).length;
    const failedCount = uploads.filter((upload) => upload.status === "failed").length;

    return {
      all: uploads.length,
      draft: draftCount,
      published: publishedCount,
      failed: failedCount,
    };
  }, [uploads]);

  const filteredUploads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedFilter = activeFilter.toLowerCase();

    return uploads.filter((upload) => {
      const matchesFilter =
        normalizedFilter === "all" || upload.status === normalizedFilter;
      const matchesQuery =
        !normalizedQuery ||
        [upload.title, upload.caption, upload.status]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(normalizedQuery));

      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, query, uploads]);

  const handleDelete = async (upload: LibraryUpload) => {
    if (upload.status !== "draft" || deletingId) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${upload.title || "Untitled draft"}" from your draft library?`,
    );

    if (!confirmed) {
      return;
    }

    setDeleteError(null);
    setDeletingId(upload.id);

    const result = await deleteDraftUpload(upload.id);

    if (result.ok) {
      setDeletedUploadIds((currentIds) => [...currentIds, upload.id]);
    } else {
      setDeleteError(result.message);
    }

    setDeletingId(null);
  };

  return (
    <div className="space-y-6">
      <AppPageHeader
        eyebrow="Library"
        title="Upload library"
        description="Review your saved draft videos and publishing records."
        actions={
          <Button href="/upload">
            <UploadCloud size={16} aria-hidden="true" />
            Upload video
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="All uploads"
          value={String(metrics.all)}
          detail="Total videos saved to your library."
          icon={FileVideo}
        />
        <MetricCard
          label="Drafts"
          value={String(metrics.draft)}
          detail="Videos waiting in draft status."
          icon={Settings}
          tone="amber"
        />
        <MetricCard
          label="Published"
          value={String(metrics.published)}
          detail="Published records will be counted here."
          icon={UploadCloud}
          tone="emerald"
        />
        <MetricCard
          label="Failed"
          value={String(metrics.failed)}
          detail="Failed publishing attempts."
          icon={FileVideo}
          tone="rose"
        />
      </div>

      {loadError || deleteError ? (
        <div className="rounded-[var(--radius)] border border-rose-300/20 bg-rose-300/10 p-4 text-rose-100">
          <div className="flex gap-3">
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0 text-rose-200"
              aria-hidden="true"
            />
            <p className="text-sm leading-6">{deleteError ?? loadError}</p>
          </div>
        </div>
      ) : null}

      <Card>
        <div className="flex flex-col gap-3 border-b border-white/[0.08] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`focus-ring h-9 rounded-[var(--radius)] px-3 text-sm font-medium transition ${
                  activeFilter === filter
                    ? "bg-emerald-300/10 text-emerald-100"
                    : "text-[var(--muted-strong)] hover:bg-white/[0.06] hover:text-[var(--foreground)]"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
          <label className="relative block w-full lg:max-w-xs">
            <span className="sr-only">Search uploads</span>
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search uploads"
              className="pl-9"
            />
          </label>
        </div>

        <div className="hidden grid-cols-[minmax(12rem,1.1fr)_minmax(14rem,1fr)_7rem_8rem_6rem] gap-4 border-b border-white/[0.08] px-5 py-3 text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted)] md:grid">
          <span>Video</span>
          <span>Details</span>
          <span>Status</span>
          <span>Created</span>
          <span className="text-right">Action</span>
        </div>

        {filteredUploads.length > 0 ? (
          <div className="divide-y divide-white/[0.07]">
            {filteredUploads.map((upload) => (
              <UploadRow
                key={upload.id}
                upload={upload}
                deleting={deletingId === upload.id}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="p-5">
            <EmptyState
              icon={FileVideo}
              title={
                uploads.length === 0
                  ? "No drafts yet"
                  : query
                    ? "No matching uploads"
                    : `No ${activeFilter.toLowerCase()} uploads`
              }
              description={
                uploads.length === 0
                  ? "Upload a video to save your first private draft."
                  : "Try a different filter or search term."
              }
            >
              {uploads.length === 0 ? (
                <Button href="/upload" size="sm">
                  <UploadCloud size={15} aria-hidden="true" />
                  Upload video
                </Button>
              ) : null}
            </EmptyState>
          </div>
        )}
      </Card>
    </div>
  );
}

function UploadRow({
  upload,
  deleting,
  onDelete,
}: {
  upload: LibraryUpload;
  deleting: boolean;
  onDelete: (upload: LibraryUpload) => void;
}) {
  const title = upload.title || "Untitled draft";
  const caption = upload.caption || "No caption";
  const isDraft = upload.status === "draft";

  return (
    <article className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(12rem,1.1fr)_minmax(14rem,1fr)_7rem_8rem_6rem] md:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative h-24 w-36 shrink-0 overflow-hidden rounded-[var(--radius)] border border-white/[0.1] bg-black/45">
          {upload.signedUrl ? (
            <video
              src={upload.signedUrl}
              className="h-full w-full object-cover"
              controls
              muted
              playsInline
              preload="metadata"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[var(--muted)]">
              <FileVideo size={26} aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="min-w-0 md:hidden">
          <h3 className="truncate text-sm font-semibold text-[var(--foreground)]">
            {title}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm leading-5 text-[var(--muted)]">
            {caption}
          </p>
        </div>
      </div>

      <div className="hidden min-w-0 md:block">
        <h3 className="truncate text-sm font-semibold text-[var(--foreground)]">
          {title}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm leading-5 text-[var(--muted)]">
          {caption}
        </p>
      </div>

      <div>
        <Badge variant={isDraft ? "warning" : getStatusVariant(upload.status)}>
          {formatStatus(upload.status)}
        </Badge>
      </div>

      <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
        <CalendarDays size={15} aria-hidden="true" />
        <span>{formatDate(upload.created_at)}</span>
      </div>

      <div className="flex justify-start md:justify-end">
        {isDraft ? (
          <Button
            type="button"
            variant="danger"
            size="sm"
            disabled={deleting}
            onClick={() => onDelete(upload)}
          >
            {deleting ? (
              <Loader2 size={15} className="animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 size={15} aria-hidden="true" />
            )}
            Delete
          </Button>
        ) : (
          <span className="rounded-[var(--radius)] border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-xs text-[var(--muted)]">
            Drafts only
          </span>
        )}
      </div>
    </article>
  );
}

function getStatusVariant(status: string): BadgeTone {
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
