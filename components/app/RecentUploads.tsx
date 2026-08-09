import { FileVideo } from "lucide-react";
import { EmptyState } from "@/components/app/EmptyState";
import Card from "@/components/ui/Card";

export function RecentUploads() {
  return (
    <Card>
      <div className="flex flex-col gap-2 border-b border-white/[0.08] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Recent uploads
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Drafts and publishing jobs will appear here.
          </p>
        </div>
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
