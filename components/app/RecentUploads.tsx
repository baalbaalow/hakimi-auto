import { FileVideo } from "lucide-react";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export function RecentUploads() {
  return (
    <Card>
      <div className="flex flex-col gap-4 border-b border-white/[0.08] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Recent uploads
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Drafts and publishing jobs will appear here.
          </p>
        </div>
        <Button href="/upload" variant="secondary" size="sm">
          Upload video
        </Button>
      </div>
      <div className="hidden grid-cols-[1.2fr_1fr_7rem_8rem] gap-3 border-b border-white/[0.08] px-5 py-3 text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted)] sm:grid">
        <span>Video</span>
        <span>Title</span>
        <span>Status</span>
        <span>Created</span>
      </div>
      <div className="p-5">
        <EmptyState
          icon={FileVideo}
          title="No uploads yet"
          description="Upload your first video when you are ready to create a draft."
        />
      </div>
    </Card>
  );
}
