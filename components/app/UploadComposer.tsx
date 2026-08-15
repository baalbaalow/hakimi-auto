"use client";

import type { DragEvent, FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileUp,
  FileVideo,
  Loader2,
  Settings,
  UploadCloud,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { AppPageHeader } from "@/components/app/AppPageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  ACTIVE_UPLOAD_GRACE_MS,
  ACTIVE_UPLOAD_STORAGE_KEY,
  LAST_ACTIVITY_STORAGE_KEY,
} from "@/lib/inactivity";
import type { TikTokAccountSummary } from "@/lib/tiktok-login";
import { createClient } from "@/utils/supabase/client";

const VIDEO_BUCKET = "videos";
const CAPTION_LIMIT = 2200;
const ACCEPTED_VIDEO_TYPES = new Set(["video/mp4", "video/quicktime"]);
const ACCEPTED_VIDEO_EXTENSIONS = [".mp4", ".mov"];

type UploadComposerProps = {
  userId: string;
  tiktokAccount: TikTokAccountSummary | null;
};

type FieldErrors = {
  file?: string;
  title?: string;
  caption?: string;
};

type UploadPhase = "idle" | "uploading" | "saving" | "success";

type UploadWithProgressOptions = {
  supabaseUrl: string;
  publishableKey: string;
  accessToken: string;
  bucket: string;
  path: string;
  file: File;
  onProgress: (progress: number) => void;
};

export function UploadComposer({ userId, tiktokAccount }: UploadComposerProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const captionCount = useMemo(() => caption.length, [caption]);
  const isBusy = phase === "uploading" || phase === "saving";
  const selectedFileError = selectedFile ? validateVideoFile(selectedFile) : null;
  const selectedFileSize = selectedFile ? formatFileSize(selectedFile.size) : null;
  const progressValue = phase === "saving" ? 100 : uploadProgress;
  const isTikTokConnected = Boolean(tiktokAccount?.tiktok_open_id);

  const preflightItems = useMemo(
    () => [
      {
        label: "Video selected",
        status: selectedFile
          ? selectedFileError
            ? "Review"
            : "Ready"
          : "Waiting",
        ready: Boolean(selectedFile && !selectedFileError),
      },
      {
        label: "Title added",
        status: title.trim() ? "Ready" : "Waiting",
        ready: Boolean(title.trim()),
      },
      {
        label: "Caption added",
        status: caption.trim() ? "Ready" : "Waiting",
        ready: Boolean(caption.trim()),
      },
      {
        label: "Private storage",
        status: "Ready",
        ready: true,
      },
    ],
    [caption, selectedFile, selectedFileError, title],
  );

  useEffect(() => {
    if (!isBusy) {
      window.localStorage.removeItem(ACTIVE_UPLOAD_STORAGE_KEY);
      return;
    }

    const markActiveUpload = () => {
      const now = Date.now();
      window.localStorage.setItem(
        ACTIVE_UPLOAD_STORAGE_KEY,
        String(now + ACTIVE_UPLOAD_GRACE_MS),
      );
      window.localStorage.setItem(LAST_ACTIVITY_STORAGE_KEY, String(now));
    };

    markActiveUpload();
    const intervalId = window.setInterval(markActiveUpload, 30 * 1000);

    return () => {
      window.clearInterval(intervalId);
      window.localStorage.removeItem(ACTIVE_UPLOAD_STORAGE_KEY);
    };
  }, [isBusy]);

  const handleFileSelection = (file: File | null) => {
    setSelectedFile(file);
    setError(null);
    setSuccessMessage(null);
    setPhase("idle");
    setUploadProgress(0);
    setFieldErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      const fileError = file ? validateVideoFile(file) : undefined;

      if (fileError) {
        nextErrors.file = fileError;
      } else {
        delete nextErrors.file;
      }

      return nextErrors;
    });
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    if (isBusy) {
      return;
    }

    handleFileSelection(event.dataTransfer.files?.[0] ?? null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isBusy) {
      return;
    }

    const file = selectedFile;
    const trimmedTitle = title.trim();
    const trimmedCaption = caption.trim();
    const validationErrors = validateForm(file, trimmedTitle, trimmedCaption);
    setFieldErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0 || !file) {
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setPhase("uploading");
    setUploadProgress(0);

    let storagePath: string | null = null;

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

      if (!supabaseUrl || !publishableKey) {
        throw new Error("Supabase is not configured for uploads.");
      }

      const supabase = createClient();
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      const session = sessionData.session;

      if (sessionError || !session?.access_token) {
        throw new Error("Your session expired. Sign in again to upload videos.");
      }

      if (session.user.id !== userId) {
        throw new Error("Your session changed. Refresh the page and try again.");
      }

      storagePath = buildStoragePath(userId, file);

      await uploadFileWithProgress({
        supabaseUrl,
        publishableKey,
        accessToken: session.access_token,
        bucket: VIDEO_BUCKET,
        path: storagePath,
        file,
        onProgress: setUploadProgress,
      });

      setPhase("saving");
      setUploadProgress(100);

      const { error: insertError } = await supabase.from("uploads").insert({
        user_id: userId,
        title: trimmedTitle,
        caption: trimmedCaption,
        storage_path: storagePath,
        file_url: null,
        status: "draft",
      });

      if (insertError) {
        await supabase.storage.from(VIDEO_BUCKET).remove([storagePath]);
        throw new Error(
          "The video uploaded, but the draft could not be saved. Please try again.",
        );
      }

      setTitle("");
      setCaption("");
      setSelectedFile(null);
      setFieldErrors({});
      setSuccessMessage(`Draft saved: ${trimmedTitle}`);
      setPhase("success");
      setUploadProgress(0);
      router.refresh();

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The upload could not be completed. Please try again.",
      );
      setPhase("idle");
      setUploadProgress(0);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <AppPageHeader
        eyebrow="Upload video"
        title="Prepare a draft"
        description="Upload a private video and save it as a draft for your library."
        actions={<Badge variant="warning">Draft only</Badge>}
      />

      {successMessage ? (
        <div className="rounded-[var(--radius)] border border-emerald-300/20 bg-emerald-300/10 p-4 text-emerald-100">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <CheckCircle2
                size={20}
                className="mt-0.5 shrink-0 text-emerald-200"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-semibold">{successMessage}</p>
                <p className="mt-1 text-sm text-emerald-100/75">
                  Your video is stored privately and ready in the draft library.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button href="/library" size="sm">
                View library
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setSuccessMessage(null)}
              >
                Upload another
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[var(--radius)] border border-rose-300/20 bg-rose-300/10 p-4 text-rose-100">
          <div className="flex gap-3">
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0 text-rose-200"
              aria-hidden="true"
            />
            <p className="text-sm leading-6">{error}</p>
          </div>
        </div>
      ) : null}

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
                  Select an MP4 or MOV file for this draft.
                </p>
              </div>
            </div>

            <div
              onDragEnter={(event) => {
                event.preventDefault();
                if (!isBusy) {
                  setIsDragging(true);
                }
              }}
              onDragOver={(event) => {
                event.preventDefault();
                if (!isBusy) {
                  setIsDragging(true);
                }
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`min-h-72 rounded-[var(--radius)] border border-dashed p-8 text-center transition ${
                fieldErrors.file
                  ? "border-rose-300/45 bg-rose-300/10"
                  : isDragging
                    ? "border-amber-300/70 bg-amber-300/10"
                    : "border-white/[0.16] bg-white/[0.025]"
              }`}
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[var(--radius)] border border-white/[0.1] bg-white/[0.055] text-emerald-200">
                <UploadCloud size={24} aria-hidden="true" />
              </div>

              {selectedFile ? (
                <div className="mx-auto mt-5 max-w-xl rounded-[var(--radius)] border border-white/[0.1] bg-white/[0.045] p-4 text-left">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-[var(--foreground)]">
                        {selectedFile.name}
                      </p>
                      <p className="mt-2 text-sm text-[var(--muted)]">
                        {selectedFileSize} · {selectedFile.type || "video file"}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="focus-ring inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius)] border border-white/[0.1] bg-white/[0.055] text-[var(--muted-strong)] transition hover:bg-white/[0.09] disabled:opacity-50"
                      onClick={() => handleFileSelection(null)}
                      disabled={isBusy}
                      aria-label="Remove selected video"
                    >
                      <X size={15} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="mx-auto mt-5 max-w-lg text-lg font-semibold text-[var(--foreground)]">
                    Drag and drop your video here
                  </p>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    MP4 or MOV video files.
                  </p>
                </>
              )}

              <label className="focus-ring mt-6 inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-white/[0.055] px-3 text-sm font-medium text-[var(--foreground)] transition hover:bg-white/[0.09] has-disabled:pointer-events-none has-disabled:opacity-55">
                <FileUp size={16} aria-hidden="true" />
                Choose file
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,.mp4,.mov"
                  className="sr-only"
                  disabled={isBusy}
                  onChange={(event) =>
                    handleFileSelection(event.target.files?.[0] ?? null)
                  }
                />
              </label>

              {fieldErrors.file ? (
                <p className="mt-4 text-sm text-rose-200">{fieldErrors.file}</p>
              ) : null}
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
                  onChange={(event) => {
                    setTitle(event.target.value);
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  placeholder="Enter a title"
                  className="mt-2"
                  disabled={isBusy}
                  aria-invalid={Boolean(fieldErrors.title)}
                />
                {fieldErrors.title ? (
                  <span className="mt-2 block text-sm text-rose-200">
                    {fieldErrors.title}
                  </span>
                ) : null}
              </label>
              <label className="block text-sm font-medium text-[var(--muted-strong)]">
                Caption
                <Textarea
                  value={caption}
                  onChange={(event) => {
                    setCaption(event.target.value);
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  placeholder="Write a short caption"
                  rows={7}
                  maxLength={CAPTION_LIMIT}
                  className="mt-2"
                  disabled={isBusy}
                  aria-invalid={Boolean(fieldErrors.caption)}
                />
                <span className="mt-2 block text-xs text-[var(--muted)]">
                  {captionCount}/{CAPTION_LIMIT} characters
                </span>
                {fieldErrors.caption ? (
                  <span className="mt-2 block text-sm text-rose-200">
                    {fieldErrors.caption}
                  </span>
                ) : null}
              </label>
            </div>
          </Card>
        </div>

        <aside className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">
                  Draft destination
                </h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  This save only creates a private library draft.
                </p>
              </div>
              <Badge variant="warning">Draft</Badge>
            </div>

            <div className="mt-5 space-y-3">
              <InfoRow label="Draft destination" value="Private Library" />
              <InfoRow
                label="TikTok account"
                value={
                  isTikTokConnected
                    ? tiktokAccount?.display_name
                      ? `Connected as ${tiktokAccount.display_name}`
                      : "Connected"
                    : "Not connected"
                }
                tone={isTikTokConnected ? "success" : "warning"}
              />
              <InfoRow
                label="Publishing"
                value="Not enabled yet"
                tone="warning"
              />
            </div>

            {isBusy ? (
              <div className="mt-5 rounded-[var(--radius)] border border-white/[0.08] bg-white/[0.035] p-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-[var(--foreground)]">
                    {phase === "saving" ? "Saving draft" : "Uploading video"}
                  </span>
                  <span className="text-[var(--muted)]">
                    {Math.round(progressValue)}%
                  </span>
                </div>
                <div
                  className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.08]"
                  role="progressbar"
                  aria-valuenow={Math.round(progressValue)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-200"
                    style={{ width: `${progressValue}%` }}
                  />
                </div>
              </div>
            ) : null}

            <div className="mt-6">
              <Button
                type="submit"
                className="w-full"
                disabled={isBusy}
              >
                {isBusy ? (
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                ) : (
                  <UploadCloud size={16} aria-hidden="true" />
                )}
                {phase === "saving"
                  ? "Saving draft"
                  : phase === "uploading"
                    ? "Uploading video"
                    : "Save Draft"}
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
              {preflightItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-white/[0.07] bg-white/[0.025] px-3 py-2.5"
                >
                  <span className="flex items-center gap-2 text-sm text-[var(--muted-strong)]">
                    <CheckCircle2
                      size={15}
                      className={
                        item.ready ? "text-emerald-200" : "text-[var(--muted)]"
                      }
                      aria-hidden="true"
                    />
                    {item.label}
                  </span>
                  <span className="text-xs text-[var(--muted)]">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </form>
  );
}

function InfoRow({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "success" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-200"
      : tone === "warning"
        ? "text-amber-200"
        : "text-[var(--foreground)]";

  return (
    <div className="rounded-[var(--radius)] border border-white/[0.07] bg-white/[0.025] px-3 py-3">
      <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
        {label}
      </p>
      <p className={`mt-1 text-sm font-medium ${toneClass}`}>{value}</p>
    </div>
  );
}

function validateForm(
  file: File | null,
  title: string,
  caption: string,
): FieldErrors {
  const errors: FieldErrors = {};
  const fileError = validateVideoFile(file);

  if (fileError) {
    errors.file = fileError;
  }

  if (!title) {
    errors.title = "Add a title before saving the draft.";
  }

  if (!caption) {
    errors.caption = "Add a caption before saving the draft.";
  }

  if (caption.length > CAPTION_LIMIT) {
    errors.caption = `Keep the caption under ${CAPTION_LIMIT} characters.`;
  }

  return errors;
}

function validateVideoFile(file: File | null) {
  if (!file) {
    return "Choose an MP4 or MOV video before saving.";
  }

  if (file.size <= 0) {
    return "Choose a video file that is not empty.";
  }

  if (!isAcceptedVideoFile(file)) {
    return "Use an MP4 or MOV video file.";
  }

  return null;
}

function isAcceptedVideoFile(file: File) {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  return (
    ACCEPTED_VIDEO_TYPES.has(type) ||
    ACCEPTED_VIDEO_EXTENSIONS.some((extension) => name.endsWith(extension))
  );
}

function buildStoragePath(userId: string, file: File) {
  const uniqueId =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${userId}/${uniqueId}-${sanitizeFileName(file)}`;
}

function sanitizeFileName(file: File) {
  const name = file.name.trim().toLowerCase();
  const hasKnownExtension = name.endsWith(".mp4") || name.endsWith(".mov");
  const extension = getSafeExtension(file);
  const baseName = hasKnownExtension ? name.slice(0, -extension.length) : name;
  const safeBaseName = baseName
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${safeBaseName || "video"}${extension}`;
}

function getSafeExtension(file: File) {
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(".mp4")) {
    return ".mp4";
  }

  if (lowerName.endsWith(".mov")) {
    return ".mov";
  }

  return file.type === "video/quicktime" ? ".mov" : ".mp4";
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ["KB", "MB", "GB", "TB"];
  let size = bytes / 1024;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

function uploadFileWithProgress({
  supabaseUrl,
  publishableKey,
  accessToken,
  bucket,
  path,
  file,
  onProgress,
}: UploadWithProgressOptions) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const endpoint = `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/${bucket}/${encodeStoragePath(path)}`;
    const formData = new FormData();

    formData.append("cacheControl", "3600");
    formData.append("", file, file.name);

    xhr.open("POST", endpoint);
    xhr.setRequestHeader("apikey", publishableKey);
    xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
    xhr.setRequestHeader("x-upsert", "false");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.min(99, (event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
        return;
      }

      reject(new Error(getUploadErrorMessage(xhr.status, xhr.responseText)));
    };

    xhr.onerror = () => {
      reject(new Error("The video upload failed. Check your connection and try again."));
    };

    xhr.send(formData);
  });
}

function encodeStoragePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function getUploadErrorMessage(status: number, responseText: string) {
  const response = parseJsonRecord(responseText);
  const message =
    getStringValue(response, "message") ??
    getStringValue(response, "error_description") ??
    getStringValue(response, "error") ??
    getStringValue(response, "msg");

  if (message) {
    return `Upload failed: ${message}`;
  }

  if (status === 403) {
    return "Upload was blocked by storage permissions. Apply the Supabase storage migration and try again.";
  }

  if (status === 413) {
    return "The selected video is too large for this Supabase project.";
  }

  return "The video upload failed. Please try again.";
}

function parseJsonRecord(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value) as unknown;

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }

  return null;
}

function getStringValue(record: Record<string, unknown> | null, key: string) {
  const value = record?.[key];

  return typeof value === "string" && value.trim() ? value : null;
}
