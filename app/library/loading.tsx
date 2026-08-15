import { FileVideo, Search, Settings, UploadCloud } from "lucide-react";
import { AppPageHeader } from "@/components/app/AppPageHeader";
import { MetricCard } from "@/components/app/MetricCard";
import Card from "@/components/ui/Card";

export default function LibraryLoading() {
  return (
    <div className="space-y-6">
      <AppPageHeader
        eyebrow="Library"
        title="Upload library"
        description="Loading your saved drafts."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="All uploads"
          value="..."
          detail="Loading upload records."
          icon={FileVideo}
        />
        <MetricCard
          label="Drafts"
          value="..."
          detail="Loading draft records."
          icon={Settings}
          tone="amber"
        />
        <MetricCard
          label="Published"
          value="..."
          detail="Loading published records."
          icon={UploadCloud}
          tone="emerald"
        />
        <MetricCard
          label="Failed"
          value="..."
          detail="Loading failed records."
          icon={FileVideo}
          tone="rose"
        />
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-white/[0.08] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {["All", "Draft", "Processing"].map((filter) => (
              <div
                key={filter}
                className="h-9 w-24 rounded-[var(--radius)] bg-white/[0.06]"
              />
            ))}
          </div>
          <div className="relative h-11 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-secondary)] lg:max-w-xs">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
              aria-hidden="true"
            />
          </div>
        </div>
        <div className="space-y-3 p-5">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-24 rounded-[var(--radius)] border border-white/[0.08] bg-white/[0.035]"
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
