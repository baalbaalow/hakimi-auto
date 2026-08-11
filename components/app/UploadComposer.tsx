"use client";

import type { DragEvent } from "react";
import { useMemo, useState } from "react";
import { CheckCircle2, Clock3, FileUp, FileVideo, Settings, UploadCloud } from "lucide-react";
import { AppPageHeader } from "@/components/app/AppPageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

export function UploadComposer() {
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const captionCount = useMemo(() => caption.length, [caption]);

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];

    if (file) {
      setSelectedFile(file.name);
    }
  };

  return (
    <div className="space-y-6">
      <AppPageHeader
        eyebrow="Upload video"
        title="Prepare a draft"
        description="Add video metadata and review publishing readiness. Draft saving and publishing will be wired in a later backend phase."
        actions={<Badge variant="warning">Draft only</Badge>}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-5">
          <Card className="p-5">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius)] border border-emerald-300/20 bg-emerald-300/10 text-emerald-200">
                <FileVideo size={18} aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">
                  Video source
                </h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Select the asset you want to prepare.
                </p>
              </div>
            </div>

            <div
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`min-h-72 rounded-[var(--radius)] border border-dashed p-8 text-center transition ${
                isDragging
                  ? "border-amber-300/70 bg-amber-300/10"
                  : "border-white/[0.16] bg-white/[0.025]"
              }`}
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[var(--radius)] border border-white/[0.1] bg-white/[0.055] text-emerald-200">
                <UploadCloud size={24} aria-hidden="true" />
              </div>
              <p className="mx-auto mt-5 max-w-lg text-lg font-semibold text-[var(--foreground)]">
                {selectedFile ?? "Drag and drop your video here"}
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                MP4 or MOV video files.
              </p>
              <label className="focus-ring mt-6 inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-white/[0.055] px-3 text-sm font-medium text-[var(--foreground)] transition hover:bg-white/[0.09]">
                <FileUp size={16} aria-hidden="true" />
                Choose file
                <input
                  type="file"
                  accept="video/*"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    setSelectedFile(file?.name ?? null);
                  }}
                />
              </label>
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius)] border border-white/[0.1] bg-white/[0.045] text-amber-200">
                <Settings size={18} aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">
                  Draft details
                </h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Add the title and caption metadata.
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              <label className="block text-sm font-medium text-[var(--muted-strong)]">
                Title
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Enter a title"
                  className="mt-2"
                />
              </label>
              <label className="block text-sm font-medium text-[var(--muted-strong)]">
                Caption
                <Textarea
                  value={caption}
                  onChange={(event) => setCaption(event.target.value)}
                  placeholder="Write a short caption"
                  rows={7}
                  maxLength={2200}
                  className="mt-2"
                />
                <span className="mt-2 block text-xs text-[var(--muted)]">
                  {captionCount}/2200 characters
                </span>
              </label>
            </div>
          </Card>
        </div>

        <aside className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">
                  Publishing
                </h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Account and release settings.
                </p>
              </div>
              <Badge variant="warning">Not connected</Badge>
            </div>

            <label className="mt-5 block text-sm font-medium text-[var(--muted-strong)]">
              TikTok account
              <Select className="mt-2" disabled defaultValue="">
                <option value="">No TikTok account connected</option>
              </Select>
            </label>

            <label className="mt-4 block text-sm font-medium text-[var(--muted-strong)]">
              Publishing mode
              <Select className="mt-2" disabled defaultValue="draft">
                <option value="draft">Draft preparation</option>
              </Select>
            </label>

            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
              TikTok publishing is intentionally disabled until OAuth and the
              Content Posting API are implemented.
            </p>

            <div className="mt-6 grid gap-2">
              <Button type="button" variant="secondary" disabled>
                Save Draft
              </Button>
              <Button type="button" disabled>
                Publish
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius)] border border-white/[0.1] bg-white/[0.045] text-emerald-200">
                <Clock3 size={18} aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Preflight
              </h2>
            </div>

            <div className="mt-5 space-y-3">
              {[
                ["Video selected", selectedFile ? "Ready" : "Waiting"],
                ["Title added", title ? "Ready" : "Waiting"],
                ["Caption length", caption ? "Ready" : "Optional"],
              ].map(([label, status]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-white/[0.07] bg-white/[0.025] px-3 py-2.5"
                >
                  <span className="flex items-center gap-2 text-sm text-[var(--muted-strong)]">
                    <CheckCircle2
                      size={15}
                      className={status === "Ready" ? "text-emerald-200" : "text-[var(--muted)]"}
                      aria-hidden="true"
                    />
                    {label}
                  </span>
                  <span className="text-xs text-[var(--muted)]">{status}</span>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
