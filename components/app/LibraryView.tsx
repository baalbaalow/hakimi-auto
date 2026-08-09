"use client";

import { useState } from "react";
import { FileVideo } from "lucide-react";
import { EmptyState } from "@/components/app/EmptyState";
import Card from "@/components/ui/Card";

const filters = ["All", "Draft", "Processing", "Published", "Failed"];

export function LibraryView() {
  const [activeFilter, setActiveFilter] = useState("All");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-200">
          Library
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--foreground)]">
          Upload library
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Uploaded videos and publishing jobs will use the uploads table concept.
        </p>
      </div>

      <Card>
        <div className="flex flex-wrap gap-2 border-b border-white/[0.08] p-4">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`focus-ring rounded-full px-3 py-1.5 text-sm font-medium transition ${
                activeFilter === filter
                  ? "bg-white/[0.1] text-[var(--foreground)]"
                  : "text-[var(--muted-strong)] hover:bg-white/[0.06] hover:text-[var(--foreground)]"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-white/[0.08] px-5 py-3 text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted)] sm:grid-cols-[1fr_1fr_auto_auto]">
          <span>Video</span>
          <span className="hidden sm:block">Title</span>
          <span>Status</span>
          <span className="hidden sm:block">Created</span>
        </div>

        <div className="p-5">
          <EmptyState
            icon={FileVideo}
            title={`No ${activeFilter.toLowerCase()} uploads`}
            description="Your real upload records will appear here after upload storage and draft saving are connected."
          />
        </div>
      </Card>
    </div>
  );
}
