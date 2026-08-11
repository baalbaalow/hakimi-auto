"use client";

import { useState } from "react";
import { FileVideo, Search, Settings, UploadCloud } from "lucide-react";
import { EmptyState } from "@/components/app/EmptyState";
import { AppPageHeader } from "@/components/app/AppPageHeader";
import { MetricCard } from "@/components/app/MetricCard";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

const filters = ["All", "Draft", "Processing", "Published", "Failed"];

export function LibraryView() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [query, setQuery] = useState("");

  return (
    <div className="space-y-6">
      <AppPageHeader
        eyebrow="Library"
        title="Upload library"
        description="Review draft and publishing records as they become available."
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
          value="0"
          detail="No video records have been created yet."
          icon={FileVideo}
        />
        <MetricCard
          label="Drafts"
          value="0"
          detail="Draft metadata will appear here."
          icon={Settings}
          tone="amber"
        />
        <MetricCard
          label="Published"
          value="0"
          detail="Published TikTok posts will be counted here."
          icon={UploadCloud}
          tone="emerald"
        />
        <MetricCard
          label="Failed"
          value="0"
          detail="Failed publishing attempts will be surfaced here."
          icon={FileVideo}
          tone="rose"
        />
      </div>

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

        <div className="hidden grid-cols-[1.2fr_1fr_7rem_8rem] gap-3 border-b border-white/[0.08] px-5 py-3 text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted)] sm:grid">
          <span>Video</span>
          <span>Title</span>
          <span>Status</span>
          <span>Created</span>
        </div>

        <div className="p-5">
          <EmptyState
            icon={FileVideo}
            title={
              query
                ? "No matching uploads"
                : `No ${activeFilter.toLowerCase()} uploads`
            }
            description="Your real upload records will appear here after upload storage and draft saving are connected."
          />
        </div>
      </Card>
    </div>
  );
}
