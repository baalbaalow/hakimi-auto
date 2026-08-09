"use client";

import type { DragEvent } from "react";
import { useMemo, useState } from "react";
import { FileUp, UploadCloud } from "lucide-react";
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
      <div className="max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-200">
          Upload video
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--foreground)]">
          Prepare a draft
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Add a video and caption. Draft saving and publishing will be wired in a later backend phase.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-5">
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`rounded-[var(--radius)] border border-dashed p-8 text-center transition ${
              isDragging
                ? "border-[var(--accent)] bg-cyan-300/10"
                : "border-white/[0.16] bg-white/[0.03]"
            }`}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[var(--radius)] border border-white/[0.1] bg-white/[0.06] text-cyan-200">
              <UploadCloud size={22} aria-hidden="true" />
            </div>
            <p className="mt-4 text-base font-semibold text-[var(--foreground)]">
              {selectedFile ?? "Drag and drop your video here"}
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              MP4 or MOV video files.
            </p>
            <label className="focus-ring mt-5 inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-white/[0.06] px-3 text-sm font-medium text-[var(--foreground)] transition hover:bg-white/[0.09]">
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

          <div className="mt-5 space-y-4">
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
                rows={5}
                maxLength={2200}
                className="mt-2"
              />
              <span className="mt-2 block text-xs text-[var(--muted)]">
                {captionCount}/2200 characters
              </span>
            </label>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Publishing
            </h2>
            <Badge variant="warning">Not connected</Badge>
          </div>

          <label className="mt-5 block text-sm font-medium text-[var(--muted-strong)]">
            TikTok account
            <Select className="mt-2" disabled defaultValue="">
              <option value="">No TikTok account connected</option>
            </Select>
          </label>

          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
            TikTok publishing is intentionally disabled until OAuth and the Content Posting API are implemented.
          </p>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button type="button" variant="secondary" disabled>
              Save Draft
            </Button>
            <Button type="button" disabled>
              Publish
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
